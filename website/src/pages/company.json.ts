import type { APIRoute } from 'astro'
import { companyFacts } from '@/lib/seo'

/**
 * /company.json — structured company facts for machine readers.
 *
 * Deliberately flat and boring: names, numbers, contact details and a set of
 * standalone factual sentences. Anything that has to be inferred from prose is a
 * chance to be inferred wrong.
 */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(companyFacts(), null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      // Public factual data; allow any origin to read it.
      'access-control-allow-origin': '*',
    },
  })
