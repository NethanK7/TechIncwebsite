// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import node from '@astrojs/node'

export const SITE = 'https://techincglobal.com'

export default defineConfig({
  site: SITE,

  // Every page is prerendered to static HTML. Only the `/api/*` intake routes
  // opt into on-demand rendering (`prerender = false`) so the Frappe API key
  // never reaches the browser.
  output: 'static',
  adapter: node({ mode: 'standalone' }),

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
