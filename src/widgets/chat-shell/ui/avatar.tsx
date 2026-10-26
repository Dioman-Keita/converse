import { initials } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { cn } from "@/shared/lib/utils"

const HUES = [280, 250, 200, 160, 30, 340]

function hue(seed: string): number {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return HUES[h % HUES.length]
}

export function Avatar({
  name,
  seed,
  className,
  online,
}: {
  name: string
  seed: string
  className?: string
  /** Shows a green presence dot when true; nothing when false/undefined. */
  online?: boolean
}) {
  const { t } = useI18n()
  return (
    <span className="relative shrink-0">
      <span
        aria-hidden
        className={cn(
          "flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white",
          className,
        )}
        style={{ background: `oklch(0.5 0.13 ${hue(seed)})` }}
      >
        {initials(name)}
      </span>
      {online && (
        <span
          aria-label={t("presence.online")}
          className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
        />
      )}
    </span>
  )
}
