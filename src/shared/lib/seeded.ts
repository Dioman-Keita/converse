/**
 * Deterministic randomness for decoration: the same seed (a room id, a message id,
 * a date) always gives the same tilt, colors and watercolor stains, so the page
 * looks hand-made yet never reshuffles between renders or visits.
 */

/** 32-bit FNV-1a hash of a string. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Pseudo-random generator (mulberry32) returning numbers in [0, 1). */
export function seeded(seed: string): () => number {
  let state = hashString(seed)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A small, stable rotation in degrees within [-max, max]. */
export function tiltFor(seed: string, max = 1.2): number {
  const value = seeded(seed)() * 2 - 1
  return Math.round(value * max * 100) / 100
}

/** Stable pick from a list. */
export function pick<T>(seed: string, items: readonly T[]): T {
  return items[hashString(seed) % items.length]
}
