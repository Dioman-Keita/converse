import type { CSSProperties } from "react"

import { cn } from "@/shared/lib/utils"

const PLACEMENT = {
  /** Centered over the top edge. */
  top: { className: "-top-3 left-1/2", transform: "translateX(-50%)" },
  /** Across the top-left corner. */
  "top-left": { className: "-top-2 -left-5", transform: "" },
  /** Across the top-right corner. */
  "top-right": { className: "-top-2 -right-5", transform: "" },
} as const

type TapeProps = {
  placement?: keyof typeof PLACEMENT
  /** Rotation in degrees. */
  angle?: number
  className?: string
  style?: CSSProperties
}

/** A strip of masking tape holding a paper object (its parent must be positioned). */
export function Tape({ placement = "top", angle = -3, className, style }: TapeProps) {
  const place = PLACEMENT[placement]
  return (
    <span
      aria-hidden
      className={cn("tape", place.className, className)}
      style={{ transform: `${place.transform} rotate(${angle}deg)`, ...style }}
    />
  )
}
