import { motion } from "motion/react"

import { easeOut } from "@/shared/lib/motion"

/**
 * Full-screen background for standalone screens (home, sign-in): a faint grid,
 * a light leaking from the top edge, and a slow beam sweeping across the grid.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-gray-0">
      <motion.div
        className="top-glow absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: easeOut }}
      />
      <div className="grid-backdrop absolute inset-0" />
      {/* A beam of light travelling along one grid line. */}
      <motion.div
        className="absolute top-0 h-px w-40 bg-gradient-to-r from-transparent via-blue to-transparent"
        style={{ top: 112 }}
        initial={{ left: "-10rem", opacity: 0 }}
        animate={{ left: ["-10rem", "110%"], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
      />
      <motion.div
        className="absolute left-0 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent"
        style={{ left: 56 * 2, height: 140 }}
        initial={{ top: "-9rem", opacity: 0 }}
        animate={{ top: ["-9rem", "60%"], opacity: [0, 0.8, 0.8, 0] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatDelay: 5, delay: 2 }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-0 to-transparent" />
    </div>
  )
}
