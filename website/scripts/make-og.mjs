/**
 * Renders public/og/default.png (1200x630) from scripts/og.html via headless
 * Chrome. Run with `npm run og` after changing the template.
 *
 * Real PNG rather than SVG on purpose: most social and chat platforms will not
 * render an SVG Open Graph image, so an SVG card silently shows nothing.
 */
import { spawn } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const html = resolve(here, 'og.html')
const out = resolve(here, '../public/og/default.png')

const CHROME = process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

if (!existsSync(CHROME)) {
  console.error(`Chrome not found at ${CHROME}. Set CHROME_PATH and retry.`)
  process.exit(1)
}

const child = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--window-size=1200,630',
  '--default-background-color=00000000',
  `--screenshot=${out}`,
  // Local font and logo files are same-origin under file://, but Chrome still
  // needs this to read them from a file:// document.
  '--allow-file-access-from-files',
  `file://${html}`,
], { stdio: 'inherit' })

child.on('exit', (code) => {
  if (code !== 0 || !existsSync(out)) {
    console.error('OG render failed')
    process.exit(1)
  }
  console.log(`wrote ${out} (${statSync(out).size} bytes)`)
})
