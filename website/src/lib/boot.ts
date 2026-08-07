/**
 * Page boot sequence, re-run after every Astro view transition.
 *
 * Ordering matters and is deliberate:
 *   1. Reveal observer + scroll runtime start immediately — these affect content.
 *   2. The WebGL journey is deferred until after the browser has painted and
 *      gone idle, so the 3D bundle can never delay LCP. Everything readable is
 *      already in the static HTML; the canvas is decoration.
 */

import { initScroll, refreshScroll, teardownTriggers, prefersReducedMotion } from './scroll'
import { track } from './analytics'

let revealObserver: IntersectionObserver | null = null

/** Whether this page started the journey, so unboot knows to tear it down. */
let journeyStarted = false

/** Progressive reveal for [data-reveal]. Degrades to always-visible via CSS. */
function initReveal(): void {
  revealObserver?.disconnect()

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal], .rule--draw')
  if (!targets.length) return

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'))
    return
  }

  revealObserver = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const el = entry.target as HTMLElement
        // Stagger siblings that share a [data-reveal-group] parent.
        const group = el.closest('[data-reveal-group]')
        if (group) {
          const sibs = Array.from(group.querySelectorAll<HTMLElement>('[data-reveal]'))
          const i = sibs.indexOf(el)
          if (i > -1) el.style.setProperty('--reveal-delay', `${i * 70}ms`)
        }
        el.classList.add('is-in')
        obs.unobserve(el)
      }
    },
    // `threshold: 0` and a fixed pixel margin, not `0.1` and `-12%`.
    //
    // A ratio threshold is a trap here: an element taller than the viewport can
    // never reach 10% intersection while it is entering, and a `-12%` bottom
    // margin meant anything sitting in the lower eighth of the screen stayed at
    // opacity 0 while plainly visible. Both produced sections that were on
    // screen and blank — which reads as the page having failed to load.
    //
    // Any pixel of overlap now reveals, with a small bottom margin so the
    // animation still has somewhere to play.
    { rootMargin: '0px 0px -64px 0px', threshold: 0 },
  )

  targets.forEach((el) => revealObserver!.observe(el))
}

/** Header shrinks and gains a hairline once the page has moved. */
function initHeader(): void {
  const header = document.querySelector<HTMLElement>('.site-header')
  if (!header) return
  const onScroll = () => {
    header.classList.toggle('is-stuck', window.scrollY > 24)
  }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
}

/**
 * Load and start the WebGL journey, but only when the page actually has a
 * canvas mount, the device can plausibly run it, and the browser is idle.
 */
function initJourney(): void {
  const mount = document.querySelector<HTMLElement>('[data-journey]')
  if (!mount) return

  if (prefersReducedMotion()) {
    mount.setAttribute('data-journey-state', 'reduced')
    return
  }

  const idle = (fn: () => void) =>
    'requestIdleCallback' in window
      ? (window as unknown as { requestIdleCallback: (cb: () => void, o?: object) => void })
          .requestIdleCallback(fn, { timeout: 2000 })
      : setTimeout(fn, 400)

  idle(() => {
    // The mount can be swapped out between scheduling and running this.
    if (!mount.isConnected) return
    import('./three/journey')
      .then(({ startJourney }) => {
        if (!mount.isConnected) return
        journeyStarted = true
        startJourney(mount)
      })
      .catch((err) => {
        console.warn('[journey] WebGL unavailable, using static fallback', err)
        mount.setAttribute('data-journey-state', 'failed')
      })
  })
}

export function boot(): void {
  document.documentElement.classList.remove('no-js')

  initScroll()
  initReveal()
  initHeader()
  initJourney()
  track.pageview()

  // Two frames of settle before enabling transitions, so nothing animates from
  // its unstyled position on first paint.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.documentElement.classList.remove('preload')),
  )

  // Fonts changing metrics invalidates every pinned trigger's measurements.
  document.fonts?.ready.then(() => refreshScroll())
}

export function unboot(): void {
  revealObserver?.disconnect()
  revealObserver = null
  teardownTriggers()

  // Destroy the WebGL journey before the document is swapped.
  //
  // Without this the engine's module-level `active` handle survives the swap
  // while its canvas is thrown away with the old DOM. Returning to the home page
  // then hits the `if (active) return active` guard and never builds a new
  // canvas, so the entire 3D scene is silently missing until a full reload —
  // which is exactly the "reload twice or everything disappears" symptom.
  //
  // Imported lazily so navigating between pages that never had a journey does
  // not pull in the three.js chunk.
  if (journeyStarted) {
    journeyStarted = false
    void import('./three/journey').then(({ stopJourney }) => stopJourney())
  }
}
