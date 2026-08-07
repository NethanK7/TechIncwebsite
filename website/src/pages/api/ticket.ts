/**
 * Support ticket intake.
 *
 * Creates a real HD Ticket in the installed Helpdesk app (via the Frappe app's
 * whitelisted method) plus a Website Ticket Request linking the two — so the
 * team works the ticket in Helpdesk while the website console can still report
 * on where it came from.
 */
import type { APIRoute } from 'astro'
import { z } from 'zod'
import { submitTicket } from '@/lib/frappe/client'
import {
  clientIp,
  fail,
  guardFields,
  logIntakeFailure,
  looksAutomated,
  ok,
  rateLimit,
} from '@/lib/frappe/guard'

export const prerender = false

const schema = guardFields.extend({
  subject: z.string().trim().min(5, 'Give the ticket a short subject.').max(200),
  description: z
    .string()
    .trim()
    .min(20, 'Please describe the issue — what you expected, and what happened.')
    .max(8000),
  name: z.string().trim().min(2, 'Please give us your name.').max(120),
  email: z.string().trim().email('That email address does not look right.').max(200),
  organization: z.string().trim().max(160).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).default('Medium'),
  category: z.string().trim().max(80).optional(),
  page: z.string().trim().max(300).default('/support'),
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
  if (looksAutomated({ company_website, elapsed })) return ok({ received: true })

  const result = await submitTicket(data)
  if (!result.ok) {
    logIntakeFailure('ticket', result.detail, { ...data, ip })
    return fail(result.error ?? 'We could not open that ticket just now.', 502)
  }

  return ok({ ticket: result.data?.ticket })
}
