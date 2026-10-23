import { initials } from "@/entities/room"
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
}: {
  name: string
  seed: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white",
        className,
      )}
      style={{ background: `oklch(0.5 0.13 ${hue(seed)})` }}
    >
      {initials(name)}
    </span>
  )
}
