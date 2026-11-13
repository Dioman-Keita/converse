/**
 * Deterministic randomness for identity: the same seed (a user or room id) always
 * gives the same avatar gradient, so people stay recognisable between visits.
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

// oklch hues that stay clean on black (no muddy yellow-greens around 70–130°).
const AVATAR_HUES = [15, 35, 160, 185, 210, 240, 265, 290, 320, 345] as const

/**
 * A stable two-tone gradient for avatars: a hue from AVATAR_HUES drifting
 * 30–60° further, in the same saturated-but-not-neon band.
 */
export function gradientFor(seed: string): string {
  const next = seeded(seed)
  const hue = AVATAR_HUES[Math.floor(next() * AVATAR_HUES.length)]
  const shift = 30 + Math.floor(next() * 30)
  return `linear-gradient(135deg, oklch(0.74 0.14 ${hue}), oklch(0.56 0.18 ${(hue + shift) % 360}))`
}

/** Stable pick from a list. */
export function pick<T>(seed: string, items: readonly T[]): T {
  return items[hashString(seed) % items.length]
}
