/**
 * Smooth scroll + scroll-animation runtime.
 *
 * Lenis owns the scroll position; GSAP's ticker drives Lenis (one rAF loop for
 * the whole page, never two competing ones); ScrollTrigger reads from Lenis via
 * scrollerProxy. This is the same arrangement vectrfl.com uses, and it is the
 * reason its scrub feels weighted rather than snapped.
 *
 * The controller is a module singleton so it survives Astro view transitions:
 * `init()` is idempotent, and `refresh()` is called after each swap.
 */

import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenis: Lenis | null = null
let started = false

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function getLenis(): Lenis | null {
  return lenis
}

export function initScroll(): Lenis | null {
  if (started) return lenis
  started = true

  // With reduced motion we deliberately do not instantiate Lenis at all — the
  // browser's own instant scrolling is the correct behaviour, and ScrollTrigger
  // falls back to reading window scroll.
  if (prefersReducedMotion()) {
    ScrollTrigger.refresh()
    return null
  }

  lenis = new Lenis({
    duration: 1.15,
    // Long, shallow ease-out: fast initial response, long settle.
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    touchMultiplier: 1.6,
    // Touch devices already have native momentum; layering Lenis on top of it
    // fights the platform and feels laggy.
    syncTouch: false,
    autoRaf: false,
  })

  lenis.on('scroll', ScrollTrigger.update)

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  ScrollTrigger.scrollerProxy(document.documentElement, {
    scrollTop(value) {
      if (value !== undefined) lenis?.scrollTo(value, { immediate: true })
      return lenis?.scroll ?? window.scrollY
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight }
    },
  })

  ScrollTrigger.defaults({ markers: false })
  ScrollTrigger.refresh()

  return lenis
}

/** Kill every trigger owned by the page being navigated away from. */
export function teardownTriggers(): void {
  ScrollTrigger.getAll().forEach((t) => t.kill())
}

export function refreshScroll(): void {
  lenis?.resize()
  ScrollTrigger.refresh()
}

export function scrollTo(target: string | number | HTMLElement, offset = 0): void {
  if (lenis) {
    lenis.scrollTo(target as never, { offset, duration: 1.4 })
    return
  }
  const el =
    typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (typeof el === 'object' && el) {
    window.scrollTo({ top: el.offsetTop + offset, behavior: 'auto' })
  } else if (typeof target === 'number') {
    window.scrollTo({ top: target + offset, behavior: 'auto' })
  }
}

export function stopScroll(): void {
  lenis?.stop()
  document.documentElement.style.overflow = 'hidden'
}

export function startScroll(): void {
  lenis?.start()
  document.documentElement.style.overflow = ''
}

export { gsap, ScrollTrigger }
