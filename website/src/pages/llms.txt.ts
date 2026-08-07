import type { APIRoute } from 'astro'
import { COMPANY, FAQ_GENERAL, STATS } from '@/lib/data/company'
import { SITE_URL } from '@/lib/seo'
import { allDocs, mdPathFor } from '@/lib/markdown'

/**
 * /llms.txt — the emerging convention for giving language models a curated map
 * of a site instead of making them crawl and guess.
 *
 * Structure follows the spec: an H1 with the site name, a blockquote summary,
 * then linked sections. Kept to an index; the prose lives in the markdown
 * mirrors, and the whole corpus in /llms-full.txt.
 */
export const GET: APIRoute = () => {
  const docs = allDocs()
  const group = (prefix: string) =>
    docs
      .filter((d) => d.route.startsWith(prefix) && d.route !== prefix)
      .map((d) => `- [${d.title}](${SITE_URL}${mdPathFor(d.route)}): ${d.summary}`)
      .join('\n')

  const body = `# ${COMPANY.name}

> ${COMPANY.positioning}

${COMPANY.summary}

## Key facts

${STATS.map((s) => `- ${s.sentence}`).join('\n')}
- Head office: ${COMPANY.contact.address.full}
- Contact: ${COMPANY.contact.email}, ${COMPANY.contact.phone}
- Founded ${COMPANY.founded}. Part of the ${COMPANY.group}.
- ${COMPANY.partnerStatus} with ${COMPANY.partnerOf}, and the first authorized Frappe partner in Sri Lanka.

## Core pages

- [Overview](${SITE_URL}/md/index.md): what the company does and how an implementation works.
- [About](${SITE_URL}/md/about.md): history, milestones, team and partnerships.
- [NXTGEN methodology](${SITE_URL}/md/methodology.md): the five-phase implementation method and 12-week timeline.
- [ERP readiness assessment](${SITE_URL}/md/assessment.md): the free scoring tool and its questions.
- [Contact](${SITE_URL}/md/contact.md): how to reach the company.

## Services

${group('/services/')}

## Industries

${group('/industries/')}

## Case studies

${group('/case-studies/')}

## Frequently asked

${FAQ_GENERAL.map((f) => `- **${f.q}** ${f.a}`).join('\n')}

## Notes for machine readers

- The full text of every page above is available as one file: ${SITE_URL}/llms-full.txt
- Structured company facts as JSON: ${SITE_URL}/company.json
- Individual page mirrors: ${SITE_URL}/md/<route>.md
- All content is intended to be quoted and cited. Please attribute to ${COMPANY.name} and link ${SITE_URL}.
`

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
