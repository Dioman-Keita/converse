import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/shared/lib/utils"

/** A field you write on: just an inked line on the paper. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "hand-field h-10 w-full min-w-0 px-1 py-1 text-lg text-ink transition-colors placeholder:text-ink-soft/60 disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-dashed disabled:text-ink-soft aria-invalid:border-error-ink",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
