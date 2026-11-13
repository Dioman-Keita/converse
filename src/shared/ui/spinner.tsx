import { cn } from "@/shared/lib/utils"

/** Twelve fading ticks, like a system spinner. Inherits the text color. */
export function Spinner({ className, label }: { className?: string; label?: string }) {
  return (
    <span
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-block size-4", className)}
    >
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className="absolute top-0 left-[calc(50%-0.75px)] h-full w-[1.5px]"
          style={{ rotate: `${i * 30}deg` }}
        >
          <span
            className="block h-[28%] w-full animate-[spinner-tick_1s_linear_infinite] rounded-full bg-current"
            style={{ animationDelay: `${i / 12 - 1}s` }}
          />
        </span>
      ))}
    </span>
  )
}
