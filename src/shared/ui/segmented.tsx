import { motion } from "motion/react"
import type { ReactNode } from "react"

import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

type Option<T extends string> = { value: T; label: ReactNode; lang?: string }

type SegmentedProps<T extends string> = {
  /** Unique per screen: names the sliding indicator's layout animation. */
  name: string
  /** Accessible name of the group. */
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** One choice among a few: a raised pill slides under the chosen option. */
export function Segmented<T extends string>({ name, label, options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex rounded-lg border border-hairline bg-gray-0 p-0.5", className)}
    >
      {options.map((option) => {
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
              "relative h-8 flex-1 rounded-md px-3 text-[13px] font-medium transition-colors duration-150",
              checked ? "text-gray-900" : "text-gray-700 hover:text-gray-900",
            )}
          >
            {checked && (
              <motion.span
                layoutId={`segmented-${name}`}
                className="absolute inset-0 rounded-md border border-hairline-strong bg-gray-200 shadow-sm"
                transition={springs.indicator}
                aria-hidden
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
