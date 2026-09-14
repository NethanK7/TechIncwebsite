/**
 * ERP readiness assessment.
 *
 * Ten questions, each option carrying a 0–10 score. Shared by the browser island
 * and the `/api/assessment` endpoint so the score the visitor sees and the score
 * stored against their CRM lead are computed by the same code.
 *
 * The scoring is deliberately not "higher is better at ERP". It measures
 * *readiness to benefit from an implementation now*, which is a different thing:
 * a company with no system and clear ownership scores higher than one with a
 * heavily customised legacy ERP and no internal sponsor. That is also why the
 * bands include an honest "not yet" — we would rather set the right expectation
 * than qualify everybody as ready.
 */

import assessmentDefinition from './assessment-v1.json'

export interface Option {
  id: string
  label: string
  score: number
}

export interface Question {
  id: string
  /** Short label for the progress rail. */
  short: string
  question: string
  /** Why we are asking — shown under the question. */
  hint: string
  options: Option[]
}

const PRESENTATION = [
  {
    short: 'System status',
    hint: 'This tells us whether the work is an implementation or a migration.',
  },
  {
    short: 'Biggest pain',
    hint: 'The sharpest pain usually sets the first module we deliver.',
  },
  {
    short: 'Headcount',
    hint: 'Scope and training effort scale with headcount, not revenue.',
  },
  {
    short: 'System users',
    hint: 'This is the number that drives licence cost on other platforms — and does not on Frappe.',
  },
  {
    short: 'Scope',
    hint: 'Breadth is fine — NXTGEN segregates it into independently gated modules.',
  },
  {
    short: 'Data quality',
    hint: 'Legacy migrations fail on data, not software. Honest answers here save weeks.',
  },
  {
    short: 'Sponsorship',
    hint: 'The single strongest predictor of a successful implementation.',
  },
  {
    short: 'Timeline',
    hint: 'Our standard programme is 12 weeks; most projects land in 10 to 16.',
  },
  {
    short: 'Budget',
    hint: 'Frappe has no licence fees, so this is implementation and support only.',
  },
  {
    short: 'Capacity',
    hint: 'Cyclic Mapping needs your process owners in the room. This is non-negotiable.',
  },
]

export const QUESTIONS: Question[] = assessmentDefinition.map((question, i) => ({
  ...question, short: PRESENTATION[i].short, hint: PRESENTATION[i].hint,
}))

/** Normalised 0–100 score. */
export function scoreAnswers(answers: { score: number }[]): number {
  if (!answers.length) return 0
  const max = answers.length * 10
  const total = answers.reduce((sum, a) => sum + Math.max(0, Math.min(10, a.score)), 0)
  return Math.round((total / max) * 100)
}

export interface Band {
  name: string
  headline: string
  body: string
  /** What we would actually do next. */
  next: string
}

export function bandFor(score: number): Band {
  if (score >= 80) {
    return {
      name: 'Ready now',
      headline: 'You are ready to implement.',
      body: 'Clear ownership, allocated budget, a realistic timeline and internal capacity. This is the profile of an implementation that lands on the first attempt.',
      next: 'A scoping conversation, then a 12-week NXTGEN programme. We would expect to give you a firm scope and timeline within two weeks.',
    }
  }
  if (score >= 62) {
    return {
      name: 'Nearly ready',
      headline: 'You are close. One or two things to settle first.',
      body: 'The business case is there. Usually what is missing is a named sponsor, a data audit, or confirmation that your process owners can give the project real time.',
      next: 'A discovery workshop to close the specific gaps, then a scoped implementation. We will tell you plainly which gap matters most.',
    }
  }
  if (score >= 42) {
    return {
      name: 'Groundwork first',
      headline: 'Worth doing — but not yet.',
      body: 'There is real value available here, and starting an implementation now would probably surface problems mid-project rather than before it. Data quality and internal sponsorship are the usual culprits.',
      next: 'An advisory engagement: process mapping, a data audit, and a total cost of ownership model, so you commit budget against real numbers.',
    }
  }
  return {
    name: 'Not yet',
    headline: 'We would tell you to wait.',
    body: 'On these answers, an ERP implementation now would be an expense rather than a transformation. That is a genuine finding, not a soft no — the usual blockers are no internal sponsor and no capacity to adopt the system.',
    next: 'A short advisory conversation about what to fix first. If the real problem turns out to be process rather than software, we will say so.',
  }
}
