import type { Transition } from "motion/react"

/**
 * Motion tokens. Every animation imitates a gesture on paper (a page turned,
 * a note laid down, a sticker stuck on): springs, never "corporate" fades.
 * See docs/design/design-system.md § Motion before adding a new one.
 */
export const springs = {
  /** Turning a page: switching conversation or side panel. */
  pageTurn: { type: "spring", stiffness: 140, damping: 22 },
  /** Laying a note down on the page: a new message. */
  note: { type: "spring", stiffness: 260, damping: 22 },
  /** Dropping a polaroid. */
  polaroid: { type: "spring", stiffness: 260, damping: 20 },
  /** Sticking a label. */
  label: { type: "spring", stiffness: 200, damping: 18 },
  /** A star or sticker that pops. */
  pop: { type: "spring", stiffness: 400, damping: 14 },
  /** Opening a viewer. */
  viewer: { type: "spring", stiffness: 180, damping: 20 },
  /** Small hover/press feedback. */
  nudge: { type: "spring", stiffness: 380, damping: 24 },
} as const satisfies Record<string, Transition>

/** Hover on a paper object: it lifts and straightens. */
export const lift = { y: -3, rotate: 0, scale: 1.02 } as const

/** Press on a sticker. */
export const press = { scale: 0.96 } as const
