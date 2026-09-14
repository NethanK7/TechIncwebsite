import type { APIRoute } from 'astro'
import { z } from 'zod'
import { submitAssessment } from '@/lib/frappe/client'
import { QUESTIONS } from '@/lib/data/assessment'
import { clientIp, fail, guardFields, logIntakeFailure, looksAutomated, ok, rateLimit } from '@/lib/frappe/guard'

export const prerender = false

const schema = guardFields.extend({
  assessment_version: z.literal('1'),
  answers: z.array(z.object({ question_id: z.string().max(30), option_id: z.string().max(10) }))
    .length(QUESTIONS.length).refine((answers) =>
      new Set(answers.map((a) => a.question_id)).size === QUESTIONS.length &&
      answers.every((a) => QUESTIONS.find((q) => q.id === a.question_id)?.options.some((o) => o.id === a.option_id)),
      'Please answer every assessment question with a valid option.'),
  name: z.string().trim().min(2, 'Please give us your name.').max(120),
  email: z.string().trim().email('Please give us a valid email.').max(140),
  phone: z.string().trim().max(40).optional(),
  organization: z.string().trim().max(140).optional(),
  page: z.string().trim().max(140).default('/assessment'),
  session: z.string().trim().max(80).optional(),
})

export const POST: APIRoute = async ({ request }) => {
  const limit = rateLimit(clientIp(request))
  if (!limit.allowed) return fail('Too many submissions. Please try again shortly.', 429)
  let raw: unknown
  try { raw = await request.json() } catch { return fail('We could not read that submission.') }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Please check your details.', 422)
  const { company_website, elapsed, ...data } = parsed.data
  if (looksAutomated({ company_website, elapsed })) return ok({ received: true })
  const result = await submitAssessment(data)
  if (!result.ok || !result.data?.stored || !result.data?.assessment || !result.data?.lead) {
    logIntakeFailure('assessment', result.detail, undefined)
    return fail('Your score is ready, but we could not save your details. Please try again.', 502)
  }
  return ok({ stored: true, reference: result.data.assessment, score: result.data.score, band: result.data.band })
}
