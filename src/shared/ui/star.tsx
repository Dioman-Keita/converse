import { motion } from "motion/react"

import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

type StarProps = { size?: number; delay?: number; className?: string }

/** A yellow hand-drawn star that pops in. Marks what is special (active, unread). Use sparingly. */
export function Star({ size = 28, delay = 0, className }: StarProps) {
  return (
    <motion.svg
      className={cn("pointer-events-none drop-shadow-[0_2px_2px_rgb(0_0_0/0.25)]", className)}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      initial={{ scale: 0, rotate: -40 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ ...springs.pop, delay }}
      aria-hidden
    >
      <path
        d="M32 5l8 16.4 18 2.6-13 12.7 3 17.9L32 46.1 16 54.6l3-17.9L6 24l18-2.6z"
        fill="var(--yellow)"
        stroke="var(--ink)"
        strokeWidth="3"
        strokeLinejoin="round"
        filter="url(#rough)"
      />
    </motion.svg>
  )
}
