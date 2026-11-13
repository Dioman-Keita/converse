import type { Transition } from "motion/react"

/**
 * Motion tokens. Motion is functional and fast: things fade up into place,
 * indicators slide between positions, nothing bounces for show.
 * See docs/design/design-system.md § Motion before adding a new one.
 */

/** Exponential ease-out: quick start, long soft landing. */
export const easeOut = [0.16, 1, 0.3, 1] as const

export const durations = {
  /** Hover, press, icon swaps. */
  fast: 0.15,
  /** Panels, list items, messages. */
  base: 0.3,
  /** Page-level entrances. */
  slow: 0.6,
} as const

export const springs = {
  /** Sliding indicators (active conversation, segmented control). */
  indicator: { type: "spring", stiffness: 500, damping: 40, mass: 0.8 },
  /** Items moving to a new place in a list. */
  layout: { type: "spring", stiffness: 400, damping: 36 },
  /** Small elements appearing (badges, presence dots). */
  pop: { type: "spring", stiffness: 600, damping: 30 },
  /** Dialogs and viewers. */
  dialog: { type: "spring", stiffness: 380, damping: 32 },
} as const satisfies Record<string, Transition>

export const transitions = {
  fast: { duration: durations.fast, ease: easeOut },
  base: { duration: durations.base, ease: easeOut },
  slow: { duration: durations.slow, ease: easeOut },
} as const satisfies Record<string, Transition>

/** Fade up with a touch of blur: the default entrance. */
export const fadeUp = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -4, filter: "blur(4px)" },
} as const

/** Panels sliding in from the side (sidebar views). */
export const slideIn = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
} as const

/** Stagger delay for the i-th item of a list, capped so long lists don't drag. */
export function stagger(i: number, step = 0.03, max = 12): number {
  return Math.min(i, max) * step
}
