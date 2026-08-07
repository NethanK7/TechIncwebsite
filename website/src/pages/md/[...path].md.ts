import type { APIRoute, GetStaticPaths } from 'astro'
import { allDocs, mdPathFor, renderDoc } from '@/lib/markdown'

/**
 * Per-page markdown mirrors at `/md/<route>.md`.
 *
 * Linked from each page's <head> as `rel="alternate" type="text/markdown"`, so a
 * crawler that wants clean content can find it from the HTML rather than having
 * to be told about it out of band.
 */
export const getStaticPaths = (() =>
  allDocs().map((doc) => ({
    // mdPathFor gives `/md/services/foo.md`; the [...path] param wants
    // `services/foo` — strip the prefix and the extension.
    params: { path: mdPathFor(doc.route).replace(/^\/md\//, '').replace(/\.md$/, '') },
    props: { doc },
  }))) satisfies GetStaticPaths

export const GET: APIRoute = ({ props }) =>
  new Response(renderDoc((props as { doc: Parameters<typeof renderDoc>[0] }).doc), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  })
