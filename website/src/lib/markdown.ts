/**
 * Markdown mirrors of the site's content.
 *
 * These feed three surfaces: `/llms.txt` (index), `/llms-full.txt` (whole
 * corpus in one file) and `/md/<route>.md` (one file per page).
 *
 * The reason to bother: a generative engine reading a page has to strip nav,
 * scripts and markup before it can use the content, and whatever it recovers is
 * a lossy guess at the structure. A clean markdown mirror removes that guess —
 * headings are unambiguous, the facts are in sentences, and the FAQ pairs are
 * literally question-then-answer. It costs a few kilobytes and materially
 * improves the odds of being quoted accurately.
 *
 * Every document is generated from lib/data/company.ts, so a mirror can never
 * drift from the rendered page.
 */

import {
  CASE_STUDIES,
  COMPANY,
  FAQ_GENERAL,
  INDUSTRIES,
  JOURNEY,
  MILESTONES,
  NXTGEN_PHASES,
  PARTNERSHIPS,
  SERVICES,
  STATS,
  STORY,
  TEAM,
  TIMELINE,
  type Faq,
} from './data/company'
import { QUESTIONS } from './data/assessment'
import { SITE_URL } from './seo'

export interface Doc {
  /** Route this mirrors, e.g. `/services/erpnext-implementation`. */
  route: string
  title: string
  summary: string
  body: string
}

const h = (level: number, text: string) => `${'#'.repeat(level)} ${text}\n`
const p = (text: string) => `${text}\n`
const bullets = (items: string[]) => items.map((i) => `- ${i}`).join('\n') + '\n'

const faqBlock = (items: Faq[]): string =>
  items.length
    ? '\n' + h(2, 'Questions and answers') + items.map((f) => `**${f.q}**\n\n${f.a}\n`).join('\n')
    : ''

/** Identity block repeated at the top of every document. */
const identity = () =>
  [
    `> ${COMPANY.positioning}`,
    '',
    `- Organisation: ${COMPANY.name} (${COMPANY.legalName})`,
    `- Position: ${COMPANY.motto}`,
    `- Founded: ${COMPANY.founded}`,
    `- Group: ${COMPANY.group}`,
    `- Partner status: ${COMPANY.partnerStatus}, ${COMPANY.partnerOf}`,
    `- Location: ${COMPANY.contact.address.full}`,
    `- Contact: ${COMPANY.contact.email} · ${COMPANY.contact.phone}`,
    `- Website: ${SITE_URL}`,
    '',
  ].join('\n')

/* -------------------------------------------------------------------------- */
/*  Documents                                                                  */
/* -------------------------------------------------------------------------- */

function homeDoc(): Doc {
  const body = [
    identity(),
    h(2, 'What TECHINCGLOBAL does'),
    p(COMPANY.summary),
    '',
    h(2, 'Key facts'),
    bullets(STATS.map((s) => s.sentence)),
    '',
    h(2, 'How an implementation connects a business'),
    p(
      'The company positions a Frappe ERP implementation as connecting separate departments into one system. The stages it describes are:',
    ),
    '',
    JOURNEY.map((s) => `${s.index}. **${s.title}** — ${s.body}`).join('\n\n'),
    '',
    h(2, 'Services'),
    bullets(SERVICES.map((s) => `${s.name}: ${s.summary}`)),
    '',
    h(2, 'Industries'),
    bullets(INDUSTRIES.map((i) => `${i.name}: ${i.summary}`)),
    faqBlock(FAQ_GENERAL),
  ].join('\n')

  return {
    route: '/',
    title: `${COMPANY.name} — ${COMPANY.motto}`,
    summary: COMPANY.summary,
    body,
  }
}

function aboutDoc(): Doc {
  const body = [
    identity(),
    h(2, STORY.title),
    STORY.paragraphs.map(p).join('\n'),
    '',
    h(2, 'Milestones'),
    MILESTONES.map((m) => `- **${m.year} — ${m.name}.** ${m.body}`).join('\n'),
    '',
    h(2, 'Team'),
    TEAM.map((t) => `- **${t.name}**, ${t.role}. ${t.bio}`).join('\n'),
    '',
    h(2, 'Partnerships'),
    PARTNERSHIPS.map((x) => `- **${x.name}** (${x.status}). ${x.body}`).join('\n'),
  ].join('\n')

  return {
    route: '/about',
    title: `About ${COMPANY.name}`,
    summary: STORY.intro,
    body,
  }
}

function methodologyDoc(): Doc {
  const body = [
    identity(),
    h(2, 'The NXTGEN methodology'),
    p(
      'NXTGEN is TECHINCGLOBAL’s proprietary Agile ERP implementation methodology. It has five phases, and segregating scope into independently deliverable modules is what removes big-bang go-live risk.',
    ),
    '',
    NXTGEN_PHASES.map((x) => `${x.n}. **${x.name}.** ${x.body}`).join('\n\n'),
    '',
    h(2, 'Standard 12-week timeline'),
    TIMELINE.map((t) => `- **${t.weeks} — ${t.name}.** ${t.body}`).join('\n'),
    '',
    p(
      'Most projects complete in 10 to 16 weeks depending on scope. The methodology reduces deployment time by up to 40% compared with conventional approaches.',
    ),
  ].join('\n')

  return {
    route: '/methodology',
    title: 'The NXTGEN methodology',
    summary:
      'Five phases — Design, Segregate, Cyclic Mapping, Training, Go-Live Authorization — on a 12-week standard programme.',
    body,
  }
}

function serviceDoc(s: (typeof SERVICES)[number]): Doc {
  const body = [
    identity(),
    h(2, s.name),
    p(s.summary),
    '',
    p(s.body),
    '',
    h(2, 'What is delivered'),
    bullets(s.deliverables),
    faqBlock([
      {
        q: `Who provides ${s.name.toLowerCase()} in Sri Lanka?`,
        a: `${COMPANY.name} provides ${s.name} in Sri Lanka. It is the country's first and only authorized ${COMPANY.partnerOf} partner, holding ${COMPANY.partnerStatus} status, with more than 150 Frappe ERP implementations delivered since 2018.`,
      },
    ]),
  ].join('\n')

  return { route: `/services/${s.slug}`, title: s.name, summary: s.summary, body }
}

function industryDoc(i: (typeof INDUSTRIES)[number]): Doc {
  const body = [
    identity(),
    h(2, `Frappe ERP for ${i.name}`),
    p(i.summary),
    '',
    p(i.body),
    '',
    h(2, 'Problems typically found'),
    bullets(i.challenges),
  ].join('\n')

  return {
    route: `/industries/${i.slug}`,
    title: `Frappe ERP for ${i.name}`,
    summary: i.summary,
    body,
  }
}

function caseDoc(c: (typeof CASE_STUDIES)[number]): Doc {
  const body = [
    identity(),
    h(2, c.title),
    p(`Sector: ${c.sector}`),
    '',
    p(c.summary),
    '',
    h(3, 'Results'),
    bullets(c.results.map((r) => `${r.value} — ${r.label}`)),
    '',
    h(3, 'The challenge'),
    p(c.challenge),
    '',
    h(3, 'The approach'),
    p(c.approach),
    '',
    h(3, 'The outcome'),
    p(c.outcome),
    '',
    h(3, 'Client comment'),
    p(`> ${c.quote}`),
  ].join('\n')

  return { route: `/case-studies/${c.slug}`, title: c.title, summary: c.summary, body }
}

function assessmentDoc(): Doc {
  const body = [
    identity(),
    h(2, 'ERP readiness assessment'),
    p(
      `A free ${QUESTIONS.length}-question tool that scores readiness to benefit from an ERP implementation now. It takes about five minutes, requires no email address to see the score, and returns a recommendation — including advising against proceeding when that is the honest answer.`,
    ),
    '',
    h(2, 'Questions asked'),
    QUESTIONS.map((q, n) => `${n + 1}. **${q.question}** ${q.hint}`).join('\n'),
    '',
    h(2, 'Scoring bands'),
    bullets([
      '80–100 — Ready now: proceed to a scoping conversation and a 12-week programme.',
      '62–79 — Nearly ready: close one or two specific gaps first.',
      '42–61 — Groundwork first: advisory engagement before implementation.',
      'Below 42 — Not yet: we would advise waiting and say why.',
    ]),
    '',
    p(`Available at ${SITE_URL}/assessment`),
  ].join('\n')

  return {
    route: '/assessment',
    title: 'Free ERP readiness assessment',
    summary: `A free ${QUESTIONS.length}-question ERP readiness assessment with an honest score and recommendation.`,
    body,
  }
}

function contactDoc(): Doc {
  const body = [
    identity(),
    h(2, 'How to get in touch'),
    bullets([
      `Email: ${COMPANY.contact.email}`,
      `Phone: ${COMPANY.contact.phone}`,
      `Office: ${COMPANY.contact.address.full}`,
      `Consultation form: ${SITE_URL}/contact`,
      `Support tickets (existing clients): ${SITE_URL}/support`,
      'Hours: Monday to Friday, 08:30–17:30 (+05:30)',
    ]),
    '',
    p(
      'Enquiries receive a reply within one business day. The first consultation is free and carries no obligation.',
    ),
  ].join('\n')

  return {
    route: '/contact',
    title: `Contact ${COMPANY.name}`,
    summary: `Email ${COMPANY.contact.email} or phone ${COMPANY.contact.phone}.`,
    body,
  }
}

/** Every mirrored document, in a sensible reading order. */
export function allDocs(): Doc[] {
  return [
    homeDoc(),
    aboutDoc(),
    methodologyDoc(),
    assessmentDoc(),
    contactDoc(),
    ...SERVICES.map(serviceDoc),
    ...INDUSTRIES.map(industryDoc),
    ...CASE_STUDIES.map(caseDoc),
  ]
}

/** Render one document as a complete markdown file. */
export function renderDoc(doc: Doc): string {
  return [
    `# ${doc.title}`,
    '',
    `*Source: ${SITE_URL}${doc.route === '/' ? '' : doc.route}*`,
    '',
    doc.body.trim(),
    '',
    '---',
    '',
    `Published by ${COMPANY.name}. ${COMPANY.motto}. ${SITE_URL}`,
    '',
  ].join('\n')
}

/** Route → `/md/...` path. `/` becomes `/md/index.md`. */
export const mdPathFor = (route: string): string =>
  `/md${route === '/' ? '/index' : route}.md`
