import { X } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { useI18n } from "@/shared/i18n"
import { springs, transitions } from "@/shared/lib/motion"
import { Button } from "@/shared/ui"

type LightboxProps = { src: string; alt: string; onClose: () => void }

/**
 * Full-screen photo viewer. Escape, the close button or a click outside closes it.
 */
export function Lightbox({ src, alt, onClose }: LightboxProps) {
  const { t } = useI18n()
  const close = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    close.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    // Keep the page behind from scrolling while the photo is open.
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [onClose])

  // Portaled to <body> so transformed ancestors can't trap `position: fixed`.
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-10"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transitions.fast}
    >
      <Button
        ref={close}
        variant="secondary"
        size="icon"
        aria-label={t("media.close")}
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full"
      >
        <X />
      </Button>
      <motion.img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="block max-h-full max-w-full rounded-lg object-contain shadow-lg"
        initial={{ scale: 0.92, opacity: 0, filter: "blur(8px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={springs.dialog}
      />
    </motion.div>,
    document.body,
  )
}
