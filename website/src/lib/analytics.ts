/**
 * First-party analytics beacon.
 *
 * Posts to our own `/api/analytics` route, which forwards to Frappe as
 * `Website Visit` / `Website Event` records. No third-party scripts, no
 * cookies, no cross-site identifiers — the session id lives in sessionStorage
 * and dies with the tab, which keeps this outside consent-banner territory.
 *
 * Every call is fire-and-forget: analytics must never be able to break a page.
 */

const SESSION_KEY = 'ti.sid'
const ENDPOINT = '/api/analytics'

type EventType = 'pageview' | 'scroll_stage' | 'cta_click' | 'form_step' | 'form_submit'

interface Payload {
  type: EventType
  /** Named `session`, never `sid`: Frappe reserves `sid` for its session cookie
   *  and consumes any parameter by that name before a method ever sees it. */
  session: string
  path: string
  referrer?: string
  value?: string
  meta?: Record<string, string | number>
}

function sessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // Private browsing with storage blocked — degrade to an ephemeral id.
    return 'anon'
  }
}

function send(payload: Payload): void {
  try {
    const body = JSON.stringify(payload)
    // sendBeacon survives page unload, which is the only way scroll-depth and
    // exit events reliably arrive.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    })
  } catch {
    /* never surface analytics failures */
  }
}

/** Deepest journey stage reached this pageview, reported once on exit. */
let deepestStage = -1
let stageLabel = ''
let exitHooked = false

function hookExit(): void {
  if (exitHooked) return
  exitHooked = true
  const flush = () => {
    if (deepestStage < 0) return
    send({
      type: 'scroll_stage',
      session: sessionId(),
      path: location.pathname,
      value: stageLabel,
      meta: { stage: deepestStage },
    })
    deepestStage = -1
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
  window.addEventListener('pagehide', flush)
}

export const track = {
  pageview(): void {
    send({
      type: 'pageview',
      session: sessionId(),
      path: location.pathname,
      referrer: document.referrer || undefined,
      meta: {
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
      },
    })
    hookExit()
  },

  /** Called by the journey engine as the camera enters each stage. */
  stage(index: number, label: string): void {
    if (index <= deepestStage) return
    deepestStage = index
    stageLabel = label
    hookExit()
  },

  cta(label: string): void {
    send({ type: 'cta_click', session: sessionId(), path: location.pathname, value: label })
  },

  formStep(form: string, step: number): void {
    send({
      type: 'form_step',
      session: sessionId(),
      path: location.pathname,
      value: form,
      meta: { step },
    })
  },

  formSubmit(form: string, ok: boolean): void {
    send({
      type: 'form_submit',
      session: sessionId(),
      path: location.pathname,
      value: form,
      meta: { ok: ok ? 1 : 0 },
    })
  },

  sessionId,
}

/** Wire every [data-cta] element once per page. */
export function initCtaTracking(): void {
  document.querySelectorAll<HTMLElement>('[data-cta]').forEach((el) => {
    if (el.dataset.ctaBound) return
    el.dataset.ctaBound = '1'
    el.addEventListener('click', () => track.cta(el.dataset.cta || el.textContent?.trim() || ''))
  })
}
