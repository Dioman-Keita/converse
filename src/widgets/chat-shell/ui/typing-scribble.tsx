import { motion, useReducedMotion } from "motion/react"

/** A pencil line being scribbled, over and over, while someone is typing. */
export function TypingScribble() {
  const reduce = useReducedMotion()
  return (
    <span className="note note-theirs flex items-center px-3 py-2" aria-hidden>
      <svg width="46" height="18" viewBox="0 0 46 18" className="overflow-visible">
        <motion.path
          d="M2 11 C 6 3, 9 3, 11 10 S 16 16, 19 8 S 25 2, 27 10 S 33 15, 36 8 S 41 5, 44 9"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          filter="url(#rough)"
          initial={{ pathLength: reduce ? 1 : 0 }}
          animate={reduce ? { pathLength: 1 } : { pathLength: [0, 1, 1], opacity: [1, 1, 0] }}
          transition={reduce ? { duration: 0 } : { duration: 1.6, times: [0, 0.75, 1], repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </span>
  )
}
