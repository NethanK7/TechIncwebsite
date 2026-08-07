/**
 * First-party analytics sink.
 *
 * Receives sendBeacon posts from lib/analytics.ts and forwards them to Frappe.
 * Always answers 204 regardless of what happens downstream: analytics must never
 * be able to surface an error to a visitor, and beacons ignore the body anyway.
 */
import type { APIRoute } from 'astro'
import { z } from 'zod'
import { submitAnalytics } from '@/lib/frappe/client'
import { clientIp, country, deviceClass, rateLimit } from '@/lib/frappe/guard'

export const prerender = false

const schema = z.object({
  type: z.enum(['pageview', 'scroll_stage', 'cta_click', 'form_step', 'form_submit']),
  session: z.string().trim().max(80),
  path: z.string().trim().max(300),
  referrer: z.string().trim().max(500).optional(),
  value: z.string().trim().max(200).optional(),
  meta: z.record(z.union([z.string().max(200), z.number()])).optional(),
})

const noContent = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })

export const POST: APIRoute = async ({ request }) => {
  // Generous limit: a single session legitimately sends a handful of events.
  if (!rateLimit(`a:${clientIp(request)}`, 0.15).allowed) return noContent()

  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return noContent()

    // Device and country are derived here and never accepted from the client.
    await submitAnalytics({
      ...parsed.data,
      device: deviceClass(request),
      country: country(request),
    })
  } catch {
    /* swallow: never surface analytics failures */
  }

  return noContent()
}
