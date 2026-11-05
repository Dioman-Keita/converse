import { AnimatePresence, motion } from "motion/react"

import { springs } from "@/shared/lib/motion"

/** An error written in red ink on the page — never a toast. */
export function FormError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          role="alert"
          className="m-0 text-lg text-error-ink"
          initial={{ opacity: 0, x: -6, rotate: -2 }}
          animate={{ opacity: 1, x: 0, rotate: 0 }}
          exit={{ opacity: 0 }}
          transition={springs.nudge}
        >
          ✗ {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}
