import { motion } from "motion/react"

import { cn } from "@/shared/lib/utils"

/** Three dots rising in turn inside a small bubble: someone is typing. */
export function TypingDots({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("flex h-8 items-center gap-1 rounded-2xl rounded-bl-md bg-bubble-theirs px-3", className)}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-gray-700"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </span>
  )
}
