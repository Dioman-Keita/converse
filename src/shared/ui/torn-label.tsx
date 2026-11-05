import { motion } from "motion/react"
import type { ReactNode } from "react"

import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

type TornLabelProps = {
  children: ReactNode
  /** Resting rotation in degrees. */
  tilt?: number
  className?: string
  /** Classes of the paper itself (padding, font size). */
  paperClassName?: string
}

/** A label of torn paper, stuck on with a small slide (titles, dates, names). */
export function TornLabel({ children, tilt = -1.5, className, paperClassName }: TornLabelProps) {
  return (
    <motion.div
      className={cn("torn-wrap", className)}
      initial={{ opacity: 0, x: -16, rotate: tilt - 3 }}
      animate={{ opacity: 1, x: 0, rotate: tilt }}
      transition={springs.label}
    >
      <div className={cn("torn px-6 pt-3 pb-3.5 text-ink", paperClassName)}>{children}</div>
    </motion.div>
  )
}
