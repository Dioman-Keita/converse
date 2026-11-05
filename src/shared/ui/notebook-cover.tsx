import { motion } from "motion/react"
import type { ReactNode } from "react"

import { springs } from "@/shared/lib/motion"
import { cn } from "@/shared/lib/utils"

import { Star } from "./star"
import { TornLabel } from "./torn-label"

type NotebookCoverProps = {
  title: ReactNode
  /** Small pink-ink note under the title. */
  note?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * A closed notebook lying slightly askew on the desk (sign-in, sign-up, home).
 * It swings into place like a cover being put down.
 */
export function NotebookCover({ title, note, children, className }: NotebookCoverProps) {
  return (
    <div className="[perspective:1600px]">
      <motion.div
        className={cn(
          "notebook-cover relative flex w-[min(460px,calc(100vw-2rem))] flex-col gap-9 rounded-[8px_14px_14px_8px] px-7 pt-14 pb-10 shadow-[var(--shadow-desk),inset_14px_0_0_rgb(0_0_0/0.18)] sm:px-10",
          className,
        )}
        initial={{ opacity: 0, y: 40, rotateY: -28, rotateX: 10, rotate: -6 }}
        animate={{ opacity: 1, y: 0, rotateY: 0, rotateX: 0, rotate: -1.2 }}
        transition={springs.pageTurn}
      >
        <Star size={40} delay={0.45} className="absolute top-6 right-7 z-[3]" />
        <span aria-hidden className="absolute top-5 left-6 z-[1] size-14 rounded-full bg-yellow shadow-[inset_0_0_0_6px_rgb(255_255_255/0.5)]" />
        <span aria-hidden className="absolute top-14 left-16 z-[1] size-8 rounded-full bg-pink" />

        <TornLabel tilt={-3} className="relative z-[2] self-center" paperClassName="px-9 pt-4 pb-5 text-center">
          <h1 className="m-0 font-title text-5xl leading-none font-normal">{title}</h1>
          {note && <p className="m-0 mt-1 text-lg text-pink-ink">{note}</p>}
        </TornLabel>

        <div className="relative z-[2]">{children}</div>
      </motion.div>
    </div>
  )
}
