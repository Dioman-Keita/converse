import { motion } from "motion/react"
import type { ReactNode } from "react"

import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

type Option<T extends string> = { value: T; label: ReactNode; lang?: string }

type StickerChoiceProps<T extends string> = {
  /** Unique per screen: names the sliding sticker's layout animation. */
  name: string
  /** Accessible name of the group. */
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** One choice among a few: the yellow sticker slides under the chosen option. */
export function StickerChoice<T extends string>({
  name,
  label,
  options,
  value,
  onChange,
  className,
}: StickerChoiceProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex gap-2", className)}>
      {options.map((option, i) => {
        const checked = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={checked}
            lang={option.lang}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex-1 px-3 py-1.5 text-base transition-colors",
              checked ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {checked && (
              <motion.span
                layoutId={`sticker-choice-${name}`}
                className="sticker absolute inset-0 bg-yellow"
                style={{ rotate: i % 2 ? 1.2 : -1.2 }}
                transition={springs.nudge}
                aria-hidden
              />
            )}
            {!checked && (
              <span aria-hidden className="absolute inset-0 rounded-[var(--radius-hand)] border-2 border-dashed border-ink/25" />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
