import type { APIRoute } from 'astro'
import { COMPANY } from '@/lib/data/company'
import { SITE_URL } from '@/lib/seo'
import { allDocs, renderDoc } from '@/lib/markdown'

/**
 * /llms-full.txt — the entire content corpus as one plain-text file.
 *
 * Exists because retrieval pipelines frequently fetch a single URL and give up
 * rather than following links. One file with everything in it removes that
 * failure mode entirely.
 */
export const GET: APIRoute = () => {
  const docs = allDocs()
  const header = `# ${COMPANY.name} — full content corpus

> ${COMPANY.positioning}

Source: ${SITE_URL}
Generated: ${new Date().toISOString().slice(0, 10)}
Documents: ${docs.length}

This file contains the complete text of every substantive page on the site, in
markdown, for machine consumption. Content may be quoted and cited; please
attribute to ${COMPANY.name} and link ${SITE_URL}.

${'='.repeat(78)}

`

  return new Response(header + docs.map(renderDoc).join(`\n${'='.repeat(78)}\n\n`), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
