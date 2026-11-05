import * as React from "react"

import { cn } from "@/shared/lib/utils"

import { Tape } from "./tape"

type CardProps = React.ComponentProps<"div"> & {
  size?: "default" | "sm"
  /** A strip of tape holds the card on the page. */
  tape?: boolean
  /** Resting rotation in degrees (keep it within ±2 for anything with fields). */
  tilt?: number
}

/** A scrap of paper laid on the page. */
function Card({ className, size = "default", tape = true, tilt = 0, style, children, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card paper paper-light relative flex flex-col gap-(--card-spacing) py-(--card-spacing) text-sm text-ink shadow-[var(--shadow-paper)] [--card-spacing:--spacing(5)] data-[size=sm]:[--card-spacing:--spacing(3)]",
        className,
      )}
      style={{ rotate: tilt ? `${tilt}deg` : undefined, ...style }}
      {...props}
    >
      {tape && <Tape angle={tilt ? -tilt * 2 : -3} />}
      {children}
    </div>
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("grid auto-rows-min items-start gap-1 px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-title text-3xl leading-tight group-data-[size=sm]/card:text-2xl", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-base text-ink-soft", className)} {...props} />
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
