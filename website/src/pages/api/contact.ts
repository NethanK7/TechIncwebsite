/**
 * Contact / consultation intake.
 *
 * On-demand rendered (the only kind of route that is), because it holds the
 * Frappe credentials. Creates a Website Enquiry and a deduplicated CRM Lead.
 */
import type { APIRoute } from 'astro'
import { z } from 'zod'
import { submitEnquiry } from '@/lib/frappe/client'
import {
  clientIp,
  country,
  deviceClass,
  fail,
  guardFields,
  logIntakeFailure,
  looksAutomated,
  ok,
  rateLimit,
} from '@/lib/frappe/guard'

export const prerender = false

const schema = guardFields.extend({
  kind: z.enum(['contact', 'consultation']).default('contact'),
  name: z.string().trim().min(2, 'Please give us your name.').max(120),
  email: z.string().trim().email('That email address does not look right.').max(200),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(160).optional(),
  employees: z.string().trim().max(40).optional(),
  industry: z.string().trim().max(80).optional(),
  interest: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, 'Tell us a little more so we can route this well.').max(4000),
  page: z.string().trim().max(300).default('/contact'),
  referrer: z.string().trim().max(500).optional(),
  session: z.string().trim().max(80).optional(),
})

export const POST: APIRoute = async ({ request }) => {
  const ip = clientIp(request)
  const limit = rateLimit(ip)
  if (!limit.allowed) {
    return fail('Too many submissions from this connection. Please try again shortly.', 429, {
      retryAfter: limit.retryAfter,
    })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return fail('We could not read that submission.')
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return fail(first?.message ?? 'Please check the form and try again.', 422, {
      field: first?.path?.[0],
    })
  }

  const { company_website, elapsed, ...data } = parsed.data

  // Silently accept and discard: telling a bot it was detected only helps it.
  if (looksAutomated({ company_website, elapsed })) return ok({ received: true })

  const result = await submitEnquiry(data)
  if (!result.ok) {
    logIntakeFailure('contact', result.detail, {
      ...data,
      ip,
      country: country(request),
      device: deviceClass(request),
    })
    return fail(result.error ?? 'We could not record that just now.', 502)
  }

  return ok({ reference: result.data?.enquiry })
}
