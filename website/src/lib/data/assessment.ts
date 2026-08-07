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

export interface Option {
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

export const QUESTIONS: Question[] = [
  {
    id: 'system',
    short: 'System status',
    question: 'What is your current system situation?',
    hint: 'This tells us whether the work is an implementation or a migration.',
    options: [
      { label: 'Spreadsheets and manual processes', score: 9 },
      { label: 'No central system at all', score: 8 },
      { label: 'Several disconnected systems', score: 8 },
      { label: 'A legacy ERP at end of life', score: 7 },
      { label: 'A modern ERP that needs customisation', score: 4 },
      { label: 'A modern ERP working well', score: 2 },
    ],
  },
  {
    id: 'pain',
    short: 'Biggest pain',
    question: 'Where does it hurt most today?',
    hint: 'The sharpest pain usually sets the first module we deliver.',
    options: [
      { label: 'Month-end takes too long', score: 9 },
      { label: 'We do not trust our stock figures', score: 9 },
      { label: 'Job or product costing is guesswork', score: 9 },
      { label: 'No visibility across departments', score: 8 },
      { label: 'Manual data entry and re-entry', score: 8 },
      { label: 'Compliance and statutory reporting', score: 7 },
    ],
  },
  {
    id: 'size',
    short: 'Headcount',
    question: 'How many people work at your organisation?',
    hint: 'Scope and training effort scale with headcount, not revenue.',
    options: [
      { label: 'Fewer than 20', score: 4 },
      { label: '20 to 50', score: 7 },
      { label: '51 to 200', score: 9 },
      { label: '201 to 500', score: 8 },
      { label: 'More than 500', score: 7 },
    ],
  },
  {
    id: 'users',
    short: 'System users',
    question: 'Roughly how many people would use the system?',
    hint: 'This is the number that drives licence cost on other platforms — and does not on Frappe.',
    options: [
      { label: 'Fewer than 10', score: 5 },
      { label: '10 to 30', score: 8 },
      { label: '31 to 100', score: 9 },
      { label: 'More than 100', score: 8 },
    ],
  },
  {
    id: 'modules',
    short: 'Scope',
    question: 'Which areas need to be covered?',
    hint: 'Breadth is fine — NXTGEN segregates it into independently gated modules.',
    options: [
      { label: 'Finance and accounting only', score: 6 },
      { label: 'Finance plus inventory', score: 8 },
      { label: 'Finance, inventory and manufacturing', score: 9 },
      { label: 'Finance, inventory, sales and CRM', score: 9 },
      { label: 'Everything, including HR and payroll', score: 8 },
    ],
  },
  {
    id: 'data',
    short: 'Data quality',
    question: 'How would you describe your current data?',
    hint: 'Legacy migrations fail on data, not software. Honest answers here save weeks.',
    options: [
      { label: 'Clean and well structured', score: 10 },
      { label: 'Mostly fine, some duplication', score: 8 },
      { label: 'Messy but recoverable', score: 6 },
      { label: 'Scattered across files and people', score: 4 },
      { label: 'We genuinely do not know', score: 3 },
    ],
  },
  {
    id: 'sponsor',
    short: 'Sponsorship',
    question: 'Who is driving this internally?',
    hint: 'The single strongest predictor of a successful implementation.',
    options: [
      { label: 'Owner or managing director', score: 10 },
      { label: 'A board-level or C-level sponsor', score: 9 },
      { label: 'A department head', score: 6 },
      { label: 'IT, without a business sponsor', score: 4 },
      { label: 'Nobody in particular yet', score: 2 },
    ],
  },
  {
    id: 'timeline',
    short: 'Timeline',
    question: 'When do you want to be live?',
    hint: 'Our standard programme is 12 weeks; most projects land in 10 to 16.',
    options: [
      { label: 'Within 3 months', score: 9 },
      { label: '3 to 6 months', score: 10 },
      { label: '6 to 12 months', score: 7 },
      { label: 'No fixed timeline', score: 4 },
    ],
  },
  {
    id: 'budget',
    short: 'Budget',
    question: 'Is there budget allocated?',
    hint: 'Frappe has no licence fees, so this is implementation and support only.',
    options: [
      { label: 'Approved and allocated', score: 10 },
      { label: 'Budgeted, pending approval', score: 8 },
      { label: 'Being scoped now', score: 6 },
      { label: 'Not yet — we are exploring', score: 3 },
    ],
  },
  {
    id: 'capacity',
    short: 'Capacity',
    question: 'Can your team give time to the project?',
    hint: 'Cyclic Mapping needs your process owners in the room. This is non-negotiable.',
    options: [
      { label: 'Yes — a dedicated internal team', score: 10 },
      { label: 'Yes — key people part-time', score: 8 },
      { label: 'Limited, but we can make time', score: 5 },
      { label: 'Realistically, very little', score: 2 },
    ],
  },
]

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
