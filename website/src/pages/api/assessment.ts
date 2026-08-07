/**
 * ERP readiness assessment intake.
 *
 * Stores the full answer set and the computed score, and creates a CRM Lead when
 * the visitor left contact details. The score is recomputed server-side from the
 * answers rather than trusted from the client — it becomes a qualification
 * signal in CRM, so it has to be authoritative.
 */
import type { APIRoute } from 'astro'
import { z } from 'zod'
import { submitAssessment } from '@/lib/frappe/client'
import { bandFor, scoreAnswers } from '@/lib/data/assessment'
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
  answers: z
    .array(
      z.object({
        question: z.string().trim().max(300),
        answer: z.string().trim().max(300),
        score: z.coerce.number().min(0).max(10),
      }),
    )
    .min(1)
    .max(20),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().email('That email address does not look right.').max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(160).optional(),
  page: z.string().trim().max(300).default('/assessment'),
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

  // Recompute rather than trust: this number qualifies a lead.
  const score = scoreAnswers(data.answers)
  const band = bandFor(score)

  const result = await submitAssessment({ ...data, score, band: band.name })
  if (!result.ok) {
    logIntakeFailure('assessment', result.detail, { ...data, score, band: band.name, ip })
    // The visitor has already seen their score client-side, so a backend failure
    // must not present as a broken assessment — report the score and move on.
    return ok({ score, band: band.name, stored: false })
  }

  return ok({ score, band: band.name, stored: true, reference: result.data?.assessment })
}
