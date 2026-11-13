import { AnimatePresence, motion } from "motion/react"

import { initials } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { springs } from "@/shared/lib/motion"
import { gradientFor } from "@/shared/lib/seeded"
import { cn } from "@/shared/lib/utils"

/** A stable gradient disc (seeded by the user or room id) with the initials on top. */
export function Avatar({
  name,
  seed,
  className,
  online,
}: {
  name: string
  seed: string
  className?: string
  /** Shows a green dot when true; nothing when false/undefined. */
  online?: boolean
}) {
  const { t } = useI18n()
  return (
    <span className="relative shrink-0">
      <span
        aria-hidden
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-[11px] font-semibold tracking-wide text-white/95 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]",
          className,
        )}
        style={{ background: gradientFor(seed) }}
      >
        {initials(name)}
      </span>
      <AnimatePresence>
        {online && (
          <motion.span
            key="online"
            aria-label={t("presence.online")}
            className="absolute right-0 bottom-0 size-2.5 rounded-full bg-green ring-2 ring-gray-50"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={springs.pop}
          />
        )}
      </AnimatePresence>
    </span>
  )
}
