import { cn } from "@/shared/lib/utils"

/** The mark: two offset speech bubbles, the front one solid. Optionally followed by the wordmark. */
export function Logo({ className, wordmark = true }: { className?: string; wordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-gray-900", className)}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
        <path
          d="M9 3.5h9a3.5 3.5 0 0 1 3.5 3.5v5a3.5 3.5 0 0 1-3.5 3.5h-.5v2.5L14.5 15.5"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 7.5h8a3.5 3.5 0 0 1 3.5 3.5v4.5A3.5 3.5 0 0 1 14 19H9.5L6 21.5V19a3.5 3.5 0 0 1-3.5-3.5V11A3.5 3.5 0 0 1 6 7.5Z"
          fill="currentColor"
        />
      </svg>
      {wordmark && <span className="text-[15px] font-semibold tracking-[-0.02em]">Converse</span>}
    </span>
  )
}
