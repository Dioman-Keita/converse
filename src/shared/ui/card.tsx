import * as React from "react"

import { cn } from "@/shared/lib/utils"

type CardProps = React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /** A 1 px top-lit edge instead of a flat border (hero cards). */
  lit?: boolean
}

/** A raised surface with a hairline border. */
function Card({ className, size = "default", lit = false, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) rounded-xl bg-gray-50 py-(--card-spacing) text-sm text-gray-900 [--card-spacing:--spacing(6)] data-[size=sm]:[--card-spacing:--spacing(4)]",
        lit ? "edge-light shadow-lg" : "border border-hairline",
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min items-start gap-1.5 px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "text-xl font-semibold tracking-[-0.02em] group-data-[size=sm]/card:text-base",
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-sm text-gray-700", className)} {...props} />
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex items-center px-(--card-spacing)", className)} {...props} />
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }
