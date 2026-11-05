import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority"
import type { VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

/**
 * Buttons are stickers: inked 2 px border, offset shadow, uneven corners.
 * Icons get the hand-drawn `#rough` wobble.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap select-none outline-none transition-[rotate,translate,box-shadow,background-color,opacity] duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:[filter:url(#rough)] [&_svg:not([class*=size-])]:size-[1.15rem]",
  {
    variants: {
      variant: {
        default:
          "sticker bg-yellow text-ink hover:-rotate-2 active:translate-x-px active:translate-y-0.5 active:shadow-[0_1px_0_rgb(51_48_43/0.75)]",
        pink: "sticker bg-pink-wash text-ink hover:rotate-2 active:translate-x-px active:translate-y-0.5 active:shadow-[0_1px_0_rgb(51_48_43/0.75)]",
        secondary:
          "sticker bg-blue-wash text-ink hover:rotate-2 active:translate-x-px active:translate-y-0.5 active:shadow-[0_1px_0_rgb(51_48_43/0.75)]",
        outline:
          "sticker bg-paper-light text-ink hover:-rotate-1 active:translate-x-px active:translate-y-0.5 active:shadow-[0_1px_0_rgb(51_48_43/0.75)]",
        ghost:
          "rounded-[var(--radius-hand)] text-ink hover:bg-ink/[0.07] hover:-rotate-3 aria-pressed:bg-yellow/60 aria-pressed:-rotate-3",
        destructive:
          "sticker bg-error-ink text-paper-light hover:-rotate-1 active:translate-y-0.5 active:shadow-[0_1px_0_rgb(51_48_43/0.75)]",
        link: "font-title text-ink underline decoration-ink decoration-2 underline-offset-4 hover:decoration-pink",
      },
      size: {
        default: "h-10 px-4 text-base",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*=size-])]:size-3.5",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6 font-title text-xl",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*=size-])]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
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
