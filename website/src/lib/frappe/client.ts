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
 * create follow-up tasks) and the website should not be able to
 * write arbitrary doctypes even if this key leaked.
 */

/**
 * Read a secret at *call* time, preferring the real process environment.
 *
 * This is not a stylistic choice. Vite statically replaces `import.meta.env.X`
 * during the build, so a value that only exists at runtime — which is exactly
 * what a Vercel environment variable is — gets inlined as `undefined` and the
 * endpoint silently reports "backend not configured" forever. Reading
 * `process.env` inside the function defers the lookup to the request, which is
 * when the variable actually exists.
 *
 * `import.meta.env` is kept as the fallback so a local `.env` still works during
 * `astro dev`, where Vite loads it and `process.env` may not carry it.
 */
function secret(name: string, fallback = ''): string {
  const fromProcess =
    typeof process !== 'undefined' && process.env ? process.env[name] : undefined
  const fromVite = (import.meta.env as Record<string, string | undefined>)[name]
  return fromProcess ?? fromVite ?? fallback
}

const frappeUrl = () => secret('FRAPPE_URL').replace(/\/$/, '')
const apiKey = () => secret('FRAPPE_API_KEY')
const apiSecret = () => secret('FRAPPE_API_SECRET')

/** Shared secret checked in addition to API-user authentication. */
const intakeSecret = () => secret('WEBSITE_INTAKE_SECRET')

/** Evaluated per call, for the same reason the getters exist. */
export const frappeConfigured = (): boolean => Boolean(frappeUrl() && apiKey() && apiSecret() && intakeSecret())

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
  if (!frappeConfigured()) {
    return {
      ok: false,
      error: 'The backend is not configured yet.',
      detail:
        'Frappe URL / API credentials / intake secret missing from the environment. On Vercel these must be set for the Production environment and the project redeployed.',
    }
  }

  const secretValue = intakeSecret()

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${frappeUrl()}/api/method/${method}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Frappe token auth: `token <key>:<secret>`.
        authorization: `token ${apiKey()}:${apiSecret()}`,
        'x-website-secret': secretValue,
      },
      body: JSON.stringify({ ...payload, website_secret: secretValue }),
      signal: controller.signal,
    })

    const text = await res.text()
    let body: unknown
    try {
      body = text ? JSON.parse(text) : {}
    } catch {
      body = { raw: text }
    }

function extractFrappeError(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const b = body as Record<string, unknown>
  if (typeof b._server_messages === 'string') {
    try {
      const parsed = JSON.parse(b._server_messages)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const item = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]) : parsed[0]
        if (item?.message) return String(item.message)
      }
    } catch {
      /* ignore parse errors */
    }
  }
  if (typeof b.exception === 'string') {
    const parts = b.exception.split(': ')
    return parts[parts.length - 1]
  }
  if (typeof b.message === 'string') return b.message
  return undefined
}

    if (!res.ok) {
      const frappeMsg = extractFrappeError(body)
      return {
        ok: false,
        error: frappeMsg || 'We could not record that just now. Please try again.',
        detail: `frappe ${res.status} on ${method}${frappeMsg ? `: ${frappeMsg}` : ''}`,
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
  submission_id: string
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
  callMethod<{ enquiry: string; lead: string; stored: boolean }>(`${APP}.submit_enquiry`, p)

export interface TicketPayload {
  submission_id: string
  name: string
  email: string
  organization?: string
  subject: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  category?: string
  page: string
  session?: string
}

export const submitTicket = (p: TicketPayload) =>
  callMethod<{ ticket: string; enquiry: string; lead: string; stored: boolean }>(`${APP}.submit_ticket`, p)

export interface AssessmentPayload {
  submission_id: string
  assessment_version: string
  answers: { question_id: string; option_id: string }[]
  name: string
  email: string
  phone?: string
  organization?: string
  page: string
  session?: string
}

export const submitAssessment = (p: AssessmentPayload) =>
  callMethod<{ assessment: string; lead: string; stored: boolean; score: number; band: string }>(`${APP}.submit_assessment`, p)

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
