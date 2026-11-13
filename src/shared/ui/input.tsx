import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/shared/lib/utils"

/** Dark field with a hairline border; focus brightens the border and adds the blue ring. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-hairline-strong bg-gray-0 px-3 text-sm text-gray-900 shadow-sm transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-gray-600 hover:border-gray-500 focus-visible:border-gray-600 focus-visible:shadow-focus disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-700 aria-invalid:border-red/60",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
