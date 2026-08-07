/**
 * Abuse controls shared by every intake endpoint.
 *
 * Three cheap, layered defences rather than one heavy one:
 *
 *   1. A honeypot field, hidden from humans by CSS. Naive bots fill everything.
 *   2. A minimum fill time. A form submitted under two seconds after render was
 *      not typed by a person.
 *   3. Per-IP token-bucket rate limiting, in memory.
 *
 * None of these is individually sufficient and together they stop essentially
 * all drive-by spam without ever showing a visitor a CAPTCHA. A Turnstile hook
 * is left in place for the day that stops being true.
 */

import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/*  Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

interface Bucket {
  tokens: number
  updated: number
}

const buckets = new Map<string, Bucket>()
const CAPACITY = 6
const REFILL_PER_MS = CAPACITY / (10 * 60 * 1000) // full bucket per 10 minutes

/**
 * In-process token bucket.
 *
 * Deliberately in memory: this is a single Node process behind the site, and a
 * shared store would be a new dependency to protect a contact form. If this ever
 * runs multi-instance, the effective limit becomes per-instance — still useful,
 * and the Frappe app validates independently.
 */
export function rateLimit(ip: string, cost = 1): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const bucket = buckets.get(ip) ?? { tokens: CAPACITY, updated: now }

  bucket.tokens = Math.min(CAPACITY, bucket.tokens + (now - bucket.updated) * REFILL_PER_MS)
  bucket.updated = now

  if (bucket.tokens < cost) {
    buckets.set(ip, bucket)
    return { allowed: false, retryAfter: Math.ceil((cost - bucket.tokens) / REFILL_PER_MS / 1000) }
  }

  bucket.tokens -= cost
  buckets.set(ip, bucket)

  // Keep the map from growing without bound on a long-lived process.
  if (buckets.size > 5000) {
    for (const [key, b] of buckets) {
      if (now - b.updated > 30 * 60 * 1000) buckets.delete(key)
    }
  }

  return { allowed: true, retryAfter: 0 }
}

export function clientIp(request: Request): string {
  const h = request.headers
  return (
    h.get('cf-connecting-ip') ??
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  )
}

/* -------------------------------------------------------------------------- */
/*  Bot heuristics                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fields every form posts alongside its real payload.
 *
 * The honeypot is deliberately permissive here rather than `.max(0)`. A schema
 * that rejects a filled honeypot returns a validation error naming the field —
 * which tells a bot author exactly what tripped them. Instead we accept it, let
 * `looksAutomated` detect it downstream, and return a normal-looking success.
 */
export const guardFields = z.object({
  /** Honeypot. Humans never see it, so any value means automation. */
  company_website: z.string().max(200).optional().default(''),
  /** Milliseconds between form render and submit. */
  elapsed: z.coerce.number().nonnegative().optional().default(0),
})

const MIN_FILL_MS = 2000

export function looksAutomated(guard: { company_website?: string; elapsed?: number }): boolean {
  if (guard.company_website) return true
  // `elapsed` is client-reported and therefore spoofable — but a bot that
  // bothers to spoof it has already passed the bar we are filtering for here.
  if ((guard.elapsed ?? 0) > 0 && (guard.elapsed ?? 0) < MIN_FILL_MS) return true
  return false
}

/* -------------------------------------------------------------------------- */
/*  Response helpers                                                           */
/* -------------------------------------------------------------------------- */

export const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export const ok = (data: Record<string, unknown> = {}) => json({ ok: true, ...data })

export const fail = (error: string, status = 400, extra: Record<string, unknown> = {}) =>
  json({ ok: false, error, ...extra }, status)

/**
 * Log a failed backend write with enough detail to replay it by hand.
 *
 * A submission that reached us but did not reach Frappe is a lost lead, so this
 * is the one place where verbose server logging is worth it.
 */
export function logIntakeFailure(kind: string, detail: string | undefined, payload: unknown): void {
  console.error(
    `[intake:${kind}] backend write failed — ${detail ?? 'no detail'}\npayload: ${JSON.stringify(
      payload,
    )}`,
  )
}

/** Coarse device class from the UA string, for analytics only. */
export function deviceClass(request: Request): string {
  const ua = request.headers.get('user-agent') ?? ''
  if (/bot|crawler|spider|crawling/i.test(ua)) return 'bot'
  if (/iPad|Tablet/i.test(ua)) return 'tablet'
  if (/Mobile|iPhone|Android/i.test(ua)) return 'mobile'
  return 'desktop'
}

/** Country from an edge header when the platform provides one. */
export function country(request: Request): string | undefined {
  return (
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-vercel-ip-country') ??
    undefined
  )
}
