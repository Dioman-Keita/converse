import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

/**
 * Primary is light on black (the one call to action on a screen); everything else
 * is a quiet surface or ghost. Press scales down slightly, nothing more.
 */
const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium select-none outline-none transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-150 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-gray-50 shadow-sm hover:bg-white",
        secondary:
          "border border-hairline-strong bg-gray-100 text-gray-900 hover:border-gray-500 hover:bg-gray-200",
        outline: "border border-hairline-strong bg-transparent text-gray-900 hover:bg-gray-100",
        ghost:
          "text-gray-700 hover:bg-gray-200 hover:text-gray-900 aria-pressed:bg-gray-200 aria-pressed:text-gray-900",
        accent: "bg-blue-strong text-white shadow-sm hover:bg-blue",
        destructive: "bg-red-soft text-red hover:bg-red/20",
        link: "h-auto px-0 text-gray-900 underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        default: "h-9 px-4 text-sm",
        xs: "h-7 gap-1.5 px-2.5 text-xs [&_svg:not([class*=size-])]:size-3.5",
        sm: "h-8 px-3 text-sm",
        lg: "h-10 px-5 text-sm",
        icon: "size-9",
        "icon-xs": "size-7 [&_svg:not([class*=size-])]:size-3.5",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
