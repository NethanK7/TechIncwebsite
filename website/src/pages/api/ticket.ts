import type { APIRoute } from 'astro'
export const prerender = false
export const POST: APIRoute = () => new Response(JSON.stringify({
  ok: false, error: 'Please raise your ticket on our support portal.',
  url: 'https://support.techincglobal.com/',
}), { status: 410, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
