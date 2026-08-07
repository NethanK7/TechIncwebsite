import type { APIRoute } from 'astro'
import { AI_CRAWLERS, SITE_URL } from '@/lib/seo'

/**
 * robots.txt, generated rather than static so the AI crawler allowlist stays in
 * one place (lib/seo.ts) alongside the rest of the GEO layer.
 *
 * The posture is deliberately *open* to AI crawlers. The commercial goal is to be
 * the source a generative engine cites when someone asks about Frappe partners in
 * Sri Lanka, and that is impossible if the content is not readable. Each agent is
 * named explicitly rather than relying on the wildcard, because several of them
 * (notably Google-Extended and Applebot-Extended) are opt-out signals that are
 * only meaningful when addressed directly.
 */
export const GET: APIRoute = () => {
  const lines: string[] = [
    '# TECHINCGLOBAL — Sri Lanka\'s #1 Frappe Partner',
    '# Content here is intended to be read, indexed and cited.',
    '',
    'User-agent: *',
    'Allow: /',
    // The intake endpoints are POST-only and hold no readable content.
    'Disallow: /api/',
    '',
  ]

  for (const agent of AI_CRAWLERS) {
    lines.push(`User-agent: ${agent}`, 'Allow: /', 'Disallow: /api/', '')
  }

  lines.push(
    '# Machine-readable surfaces',
    `Sitemap: ${SITE_URL}/sitemap-index.xml`,
    '',
    `# LLM summary:      ${SITE_URL}/llms.txt`,
    `# Full LLM corpus:  ${SITE_URL}/llms-full.txt`,
    `# Company facts:    ${SITE_URL}/company.json`,
    `# Markdown mirrors: ${SITE_URL}/md/<route>.md`,
    '',
  )

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
}
