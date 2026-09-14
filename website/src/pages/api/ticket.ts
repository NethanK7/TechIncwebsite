import type { APIRoute } from 'astro'
import { z } from 'zod'
import { submitTicket } from '@/lib/frappe/client'
import { clientIp, fail, guardFields, logIntakeFailure, looksAutomated, ok, rateLimit } from '@/lib/frappe/guard'

export const prerender = false
const schema = guardFields.extend({
  name: z.string().trim().min(2).max(120), email: z.string().trim().email().max(140),
  organization: z.string().trim().max(140).optional(), subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(20).max(8000), priority: z.enum(['Low','Medium','High','Urgent']).default('Medium'),
  category: z.string().trim().max(80).optional(), page: z.string().trim().max(140).default('/support'),
  session: z.string().trim().max(80).optional(),
})
export const POST: APIRoute = async ({ request }) => {
  const limit = rateLimit(clientIp(request)); if (!limit.allowed) return fail('Too many submissions. Please try again shortly.', 429)
  let raw: unknown; try { raw = await request.json() } catch { return fail('We could not read that submission.') }
  const parsed = schema.safeParse(raw); if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check the form.', 422)
  const { company_website, elapsed, ...data } = parsed.data; if (looksAutomated({ company_website, elapsed })) return ok({ received: true })
  const result = await submitTicket(data)
  if (!result.ok || !result.data?.stored || !result.data.ticket) { logIntakeFailure('ticket', result.detail, undefined); return fail(result.error ?? 'We could not open that ticket.', 502) }
  return ok({ stored: true, reference: result.data.ticket, lead: result.data.lead })
}
