import { motion } from "motion/react"

import { initials } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { springs } from "@/shared/lib/motion"
import { pick } from "@/shared/lib/seeded"
import { cn } from "@/shared/lib/utils"
import { WATERCOLORS } from "@/shared/lib/watercolor"

/** A watercolor dab circled in ink, with the initials written by hand. */
export function Avatar({
  name,
  seed,
  className,
  online,
}: {
  name: string
  seed: string
  className?: string
  /** Shows a green sticker when true; nothing when false/undefined. */
  online?: boolean
}) {
  const { t } = useI18n()
  return (
    <span className="relative shrink-0">
      <span
        aria-hidden
        className={cn("relative flex size-10 items-center justify-center font-title text-base text-ink", className)}
      >
        <svg viewBox="0 0 40 40" className="absolute inset-0 size-full overflow-visible">
          <circle
            cx="20"
            cy="20"
            r="17.5"
            fill={pick(seed, WATERCOLORS)}
            fillOpacity="0.7"
            stroke="var(--ink)"
            strokeWidth="2"
            filter="url(#rough)"
          />
        </svg>
        <span className="relative leading-none">{initials(name)}</span>
      </span>
      {online && (
        <motion.span
          aria-label={t("presence.online")}
          className="absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-ink bg-green"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={springs.pop}
        />
      )}
    </span>
  )
}
