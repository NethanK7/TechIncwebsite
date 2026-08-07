/**
 * Deterministic pseudo-random numbers.
 *
 * Every piece of geometry in the city is generated from a seed, so the layout
 * is identical on every load and on every machine. That matters for two
 * reasons: the camera path is authored against specific buildings, and a
 * layout that reshuffles per visit reads as noise rather than as a place.
 */

/** mulberry32 — small, fast, good enough distribution for layout work. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Rng {
  (): number
  /** Uniform in [min, max). */
  range(min: number, max: number): number
  /** Integer in [min, max]. */
  int(min: number, max: number): number
  /** True with probability p. */
  chance(p: number): boolean
  pick<T>(items: readonly T[]): T
  /** Biased toward the low end — good for building heights, where a few tall
   *  towers among many short blocks reads as a skyline. */
  power(min: number, max: number, exponent: number): number
}

export function rng(seed: number): Rng {
  const next = makeRng(seed)
  const r = (() => next()) as Rng
  r.range = (min, max) => min + next() * (max - min)
  r.int = (min, max) => Math.floor(min + next() * (max - min + 1))
  r.chance = (p) => next() < p
  r.pick = (items) => items[Math.floor(next() * items.length)]!
  r.power = (min, max, exponent) => min + Math.pow(next(), exponent) * (max - min)
  return r
}
