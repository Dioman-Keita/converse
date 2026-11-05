import { useMemo } from "react"
import type { ComponentProps, ElementType } from "react"

import { cn } from "@/shared/lib/utils"
import { seeded } from "@/shared/lib/seeded"
import { WATERCOLORS } from "@/shared/lib/watercolor"

type PaperProps = ComponentProps<"div"> & {
  /** Fixes the decoration: same seed, same stains, on every visit. */
  seed: string
  as?: ElementType
  /** Pale blue writing lines. */
  lined?: boolean
  /** Pink margin line on the left. */
  margin?: boolean
  /** Lighter paper (scraps laid on a page). */
  light?: boolean
  /** Number of watercolor stains (0 for none). */
  stains?: number
}

/** A sheet of paper with its own watercolor stains and splashes. */
export function Paper({
  seed,
  as: Tag = "div",
  lined,
  margin,
  light,
  stains = 3,
  className,
  children,
  ...props
}: PaperProps) {
  return (
    <Tag
      className={cn("paper", light && "paper-light", lined && "paper-lined", margin && "paper-margin", className)}
      {...props}
    >
      {stains > 0 && <PaperDecor seed={seed} stains={stains} />}
      {children}
    </Tag>
  )
}

function PaperDecor({ seed, stains }: { seed: string; stains: number }) {
  const decor = useMemo(() => {
    const rnd = seeded(seed)
    const color = () => WATERCOLORS[Math.floor(rnd() * WATERCOLORS.length)]
    const blobs = Array.from({ length: stains }, () => ({
      x: rnd() * 100 - 20,
      y: rnd() * 100 - 20,
      size: 160 + rnd() * 220,
      ratio: 0.6 + rnd() * 0.8,
      angle: rnd() * 180,
      color: color(),
    }))
    const dots = Array.from({ length: 6 + Math.floor(rnd() * 8) }, () => ({
      x: rnd() * 100,
      y: rnd() * 100,
      size: 3 + rnd() * 10,
      color: WATERCOLORS[Math.floor(rnd() * 4)],
    }))
    return { blobs, dots }
  }, [seed, stains])

  return (
    <div className="paper-decor" aria-hidden>
      {decor.blobs.map((b, i) => (
        <span
          key={i}
          className="blob"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.size,
            height: b.size * b.ratio,
            transform: `rotate(${b.angle}deg)`,
            background: `radial-gradient(closest-side, ${b.color} 0%, ${b.color}cc 45%, transparent 100%)`,
          }}
        />
      ))}
      {decor.dots.map((d, i) => (
        <span
          key={`d${i}`}
          className="splash"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size, background: d.color }}
        />
      ))}
    </div>
  )
}
