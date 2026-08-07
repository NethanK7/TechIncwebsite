// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import vercel from '@astrojs/vercel'

export const SITE = 'https://techincglobal.com'

export default defineConfig({
  site: SITE,

  // Every page is prerendered to static HTML. Only the `/api/*` intake routes
  // opt into on-demand rendering (`prerender = false`) so the Frappe API key
  // never reaches the browser.
  //
  // The adapter must be Vercel's, not Node's: the Node adapter emits a
  // standalone server in `dist/`, which Vercel has no idea how to serve — the
  // deployment builds "successfully" and then every route 404s at the edge.
  // The Vercel adapter emits the Build Output API layout in `.vercel/output`,
  // which is what Vercel actually looks for.
  output: 'static',
  adapter: vercel({
    // The intake routes call out to Frappe; the default 10s is tight if the
    // bench is cold.
    maxDuration: 20,
    webAnalytics: { enabled: false },
  }),

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/api/'),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },

  build: {
    inlineStylesheets: 'auto',
  },

  vite: {
    ssr: {
      // three.js is browser-only; never let it into the SSR graph.
      noExternal: ['gsap'],
    },
    build: {
      // three.js + postprocessing is the dominant chunk. Keep it isolated so
      // page navigation never re-downloads it.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/three')) return 'three'
            if (id.includes('node_modules/gsap')) return 'gsap'
            if (id.includes('node_modules/lenis')) return 'lenis'
          },
        },
      },
    },
  },
})
