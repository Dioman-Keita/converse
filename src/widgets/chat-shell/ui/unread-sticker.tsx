import { motion } from "motion/react"

import { springs } from "@/shared/lib/motion"

/** Unread count as a round yellow sticker that pops again on every new message. */
export function UnreadSticker({ count }: { count: number }) {
  const label = count > 99 ? "99+" : String(count)
  return (
    <motion.span
      key={label}
      className="sticker ml-auto flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-yellow px-1.5 font-title text-base leading-none text-ink"
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: -6 }}
      transition={springs.pop}
    >
      {label}
    </motion.span>
  )
}
