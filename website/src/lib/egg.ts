/**
 * The easter egg: five clicks on the wordmark unlock explore mode.
 *
 * This module is the glue between three things that otherwise know nothing about
 * each other — the header wordmark, the overlay markup in
 * components/sections/Explore.astro, and the WebGL engine. Keeping the glue here
 * means the overlay stays declarative and the engine stays a rendering concern.
 *
 * Lifetimes differ, which is most of the complexity here:
 *
 *   · The header carries `transition:persist`, so the wordmark is the *same*
 *     element for the whole session, across every navigation.
 *   · The overlay belongs to the home page only, and is a brand new element
 *     every time the visitor comes back to it.
 *
 * So the wordmark listener is bound once and reads the live document to decide
 * what to do, while the overlay's own buttons are re-wired on each mount. The
 * two are joined by the module-level `current` handle.
 *
 * The three.js explorer itself is imported lazily, on entry. Visitors who never
 * find the egg never download it.
 */

import { track } from './analytics'
import { startScroll, stopScroll } from './scroll'
import type { ExploreSession } from './three/explore'

export const CLICKS_TO_UNLOCK = 5

/** Clicks only count while they keep arriving; a pause resets the run. */
const CLICK_WINDOW_MS = 1400

/** Show the counter once the visitor is close, so the last clicks feel earned. */
const HINT_FROM = 3

/**
 * The overlay currently mounted, or null when the visitor is not on the home
 * page. Everything the persistent wordmark listener needs goes through here —
 * including `hint`, because the hint element belongs to the page too and a
 * closure captured on the first visit would be writing to a detached node after
 * the next navigation.
 */
let current: {
  open(): void
  close(): void
  mounted(): boolean
  hint(message: string): void
} | null = null

/** Guard for the listeners bound to elements that outlive any single page. */
let persistentWired = false

export function wireEasterEgg(overlay: HTMLElement, needed: number): void {
  const hint = document.querySelector<HTMLElement>('[data-egg-hint]')
  const hintText = document.querySelector<HTMLElement>('[data-egg-hint-text]')
  const hud = overlay.querySelector<HTMLElement>('[data-explore-hud]')
  const placeEl = overlay.querySelector<HTMLElement>('[data-explore-place]')
  const distEl = overlay.querySelector<HTMLElement>('[data-explore-dist]')
  const blurbEl = overlay.querySelector<HTMLElement>('[data-explore-blurb]')
  const startBtn = overlay.querySelector<HTMLButtonElement>('[data-explore-start]')
  const cancelBtn = overlay.querySelector<HTMLButtonElement>('[data-explore-cancel]')

  let session: ExploreSession | null = null
  let release: (() => void) | null = null
  /** Focus to restore when the overlay closes, so keyboard users are not lost. */
  let returnFocus: HTMLElement | null = null
  let hintTimer = 0

  function showHint(message: string): void {
    if (!hint || !hintText) return
    hintText.textContent = message
    hint.hidden = false
    window.clearTimeout(hintTimer)
    hintTimer = window.setTimeout(() => {
      hint.hidden = true
    }, 1600)
  }

  /* ---------------- Open / close ---------------- */

  function open(): void {
    if (!overlay.hidden) return
    returnFocus = document.activeElement as HTMLElement | null
    overlay.hidden = false
    if (hint) hint.hidden = true
    stopScroll()
    startBtn?.focus()
    track.cta('easter-egg:unlocked')
  }

  function close(): void {
    if (overlay.hidden) return
    stop()
    overlay.hidden = true
    overlay.classList.remove('is-active')
    document.documentElement.classList.remove('is-exploring')
    if (hud) hud.hidden = true
    startScroll()
    returnFocus?.focus?.()
    returnFocus = null
  }

  /* ---------------- The session ---------------- */

  async function start(): Promise<void> {
    const [{ currentJourney }, { startExplore }] = await Promise.all([
      import('./three/journey'),
      import('./three/explore'),
    ])

    const engine = currentJourney()
    if (!engine) {
      // No WebGL, reduced motion, or the scene has not booted yet. Say so rather
      // than showing an empty overlay over a page that cannot render the world.
      const gate = overlay.querySelector<HTMLElement>('[data-explore-gate]')
      if (gate) {
        gate.innerHTML =
          '<p class="eyebrow">Not available here</p>' +
          '<p class="explore__lead">Explore mode needs the 3D scene, which this ' +
          'device or your reduced-motion setting has turned off.</p>'
      }
      return
    }

    overlay.classList.add('is-active')
    document.documentElement.classList.add('is-exploring')
    if (hud) hud.hidden = false

    let hudClock = 0
    const control = engine.takeControl((dt) => {
      session?.update(dt)
      // The readout only needs to be roughly live; refreshing it every frame
      // would thrash layout inside the render loop for no visible gain.
      hudClock += dt
      if (hudClock < 0.25) return
      hudClock = 0
      const near = session?.nearest()
      if (!near || !placeEl || !distEl) return
      placeEl.textContent = near.label
      distEl.textContent = near.inside ? 'You are here' : `${near.distance} m away`
      // The explanation is the reward for walking there, so it appears only once
      // you are inside the footprint rather than whenever the place is nearest.
      if (blurbEl) {
        blurbEl.textContent = near.inside ? near.blurb : ''
        blurbEl.hidden = !near.inside || !near.blurb
      }
    })
    release = control.release

    session = startExplore({
      camera: control.camera,
      canvas: control.canvas,
      onExit: () => close(),
    })

    // Pointer lock must come from a user gesture, and the click that ran this
    // handler is one — but the dynamic imports above may have broken that chain
    // on a cold cache. The session's own canvas click handler is the fallback.
    control.canvas.requestPointerLock?.()
    track.cta('easter-egg:entered')
  }

  function stop(): void {
    session?.destroy()
    session = null
    release?.()
    release = null
  }

  startBtn?.addEventListener('click', () => void start())
  cancelBtn?.addEventListener('click', close)

  // Hand this mount to the persistent listeners below, replacing whichever
  // overlay was previously current.
  current = { open, close, mounted: () => overlay.isConnected, hint: showHint }

  /* ---------------- Listeners that outlive the page ---------------- */

  if (persistentWired) return
  persistentWired = true

  const brand = document.querySelector<HTMLAnchorElement>('.site-header__brand')
  let clicks = 0
  let lastClick = 0

  brand?.addEventListener('click', (e) => {
    // Off the home page the wordmark must keep working as its <a href="/">.
    // The header persists across navigations, so this single listener sees
    // clicks from every page; swallowing them all would leave the logo dead
    // sitewide. `current.mounted()` is true only where the overlay exists, which
    // is the home page.
    if (!current?.mounted()) return

    // On the home page, following the link navigates to the page you are already
    // on — and with ClientRouter that is a real view transition, which would
    // reset the count on every click so it could never reach five.
    e.preventDefault()

    const now = performance.now()
    clicks = now - lastClick > CLICK_WINDOW_MS ? 1 : clicks + 1
    lastClick = now

    if (clicks < needed) {
      if (clicks >= HINT_FROM) current.hint(`${needed - clicks} more`)
      return
    }

    clicks = 0
    current.open()
  })

  // Escape closes the gate. Once pointer lock is engaged the browser consumes
  // Escape itself to release it, which fires pointerlockchange and exits through
  // the session's onExit. Both routes end in close().
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') current?.close()
  })

  // A view transition swaps the DOM out from under an active session.
  document.addEventListener('astro:before-swap', () => current?.close())
}
