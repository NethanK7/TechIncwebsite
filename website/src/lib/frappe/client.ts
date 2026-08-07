/**
 * Server-side Frappe client.
 *
 * Only ever imported from `src/pages/api/*`, which are the site's single
 * non-prerendered surface. The API key never reaches the browser, and the
 * browser never talks to Frappe directly — every write goes through one of our
 * own validated endpoints.
 *
 * Calls target whitelisted methods in the `techinc_website` Frappe app rather
 * than the generic `/api/resource` REST surface. That is deliberate: the app
 * owns the business rules (dedupe a lead by email, attach an assessment to it,
 * open an HD Ticket with the right team) and the website should not be able to
 * write arbitrary doctypes even if this key leaked.
 */

const FRAPPE_URL = (import.meta.env.FRAPPE_URL ?? 'http://develop.localhost:8000').replace(
  /\/$/,
  '',
)
const API_KEY = import.meta.env.FRAPPE_API_KEY ?? ''
const API_SECRET = import.meta.env.FRAPPE_API_SECRET ?? ''

/** Shared secret the Frappe app checks on guest-allowed intake methods. */
const INTAKE_SECRET = import.meta.env.WEBSITE_INTAKE_SECRET ?? ''

export const frappeConfigured = Boolean(API_KEY && API_SECRET)

export interface FrappeResult<T = unknown> {
  ok: boolean
  data?: T
  /** Safe to show a visitor. */
  error?: string
  /** Server-side detail for logs only. */
  detail?: string
}

/**
 * POST to a whitelisted method.
 *
 * Returns a result object rather than throwing: an intake endpoint must never
 * turn a backend hiccup into a 500 for the visitor. The caller decides what to
 * tell them, and a failed submission is logged with enough detail to replay.
 */
export async function callMethod<T = unknown>(
  method: string,
  // `object` rather than Record<string, unknown>: the typed payload interfaces
  // below have no index signature, and widening here keeps them strict at the
  // call sites where correctness actually matters.
  payload: object,
  { timeoutMs = 8000 }: { timeoutMs?: number } = {},
): Promise<FrappeResult<T>> {
  if (!frappeConfigured) {
    return {
      ok: false,
      error: 'The backend is not configured yet.',
      detail: 'FRAPPE_API_KEY / FRAPPE_API_SECRET missing from the environment',
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${FRAPPE_URL}/api/method/${method}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Frappe token auth: `token <key>:<secret>`.
        authorization: `token ${API_KEY}:${API_SECRET}`,
        'x-website-secret': INTAKE_SECRET,
      },
      body: JSON.stringify({ ...payload, website_secret: INTAKE_SECRET }),
      signal: controller.signal,
    })

    const text = await res.text()
    let body: unknown
    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      body = { raw: text }
    }

    if (!res.ok) {
      return {
        ok: false,
        error: 'We could not record that just now. Please try again.',
        detail: `frappe ${res.status} on ${method}: ${text.slice(0, 500)}`,
      }
    }

    // Frappe wraps whitelisted-method returns in `message`.
    const message = (body as { message?: T })?.message
    return { ok: true, data: message ?? (body as T) }
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'AbortError'
    return {
      ok: false,
      error: 'We could not reach our systems just now. Please try again.',
      detail: aborted ? `timeout after ${timeoutMs}ms on ${method}` : String(err),
    }
  } finally {
    clearTimeout(timer)
  }
}

/* -------------------------------------------------------------------------- */
/*  Typed wrappers, one per intake surface                                     */
/* -------------------------------------------------------------------------- */

const APP = 'techinc_website.api.public'

export interface EnquiryPayload {
  kind: 'contact' | 'consultation'
  name: string
  email: string
  phone?: string
  organization?: string
  employees?: string
  industry?: string
  interest?: string
  message: string
  page: string
  referrer?: string
  session?: string
}

export const submitEnquiry = (p: EnquiryPayload) =>
  callMethod<{ enquiry: string; lead?: string }>(`${APP}.submit_enquiry`, p)

export interface TicketPayload {
  subject: string
  description: string
  name: string
  email: string
  organization?: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  category?: string
  page: string
  session?: string
}

export const submitTicket = (p: TicketPayload) =>
  callMethod<{ ticket: string | number; request: string }>(`${APP}.submit_ticket`, p)

export interface AssessmentPayload {
  answers: { question: string; answer: string; score: number }[]
  score: number
  band: string
  name?: string
  email?: string
  phone?: string
  organization?: string
  page: string
  session?: string
}

export const submitAssessment = (p: AssessmentPayload) =>
  callMethod<{ assessment: string; lead?: string }>(`${APP}.submit_assessment`, p)

export interface AnalyticsPayload {
  type: string
  /** Never `sid` — Frappe reserves that name for its session cookie. */
  session: string
  path: string
  referrer?: string
  value?: string
  meta?: Record<string, string | number>
  /** Derived server-side; never trusted from the client. */
  country?: string
  device?: string
}

export const submitAnalytics = (p: AnalyticsPayload) =>
  callMethod<{ ok: boolean }>(`${APP}.record_event`, p, { timeoutMs: 3000 })
