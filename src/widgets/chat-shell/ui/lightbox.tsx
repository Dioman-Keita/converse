import { X } from "lucide-react"
import { motion } from "motion/react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { useI18n } from "@/shared/i18n"
import { springs } from "@/shared/lib/motion"
import { Tape } from "@/shared/ui"

type LightboxProps = { src: string; alt: string; onClose: () => void }

/**
 * Full-screen photo viewer: the polaroid is picked up from the page and held up close.
 * Escape, the close button or a click outside closes it.
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

  // Portaled to <body>: the notebook pages are transformed while they turn,
  // which would otherwise trap `position: fixed` inside them.
  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-desk/85 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        ref={close}
        type="button"
        aria-label={t("media.close")}
        onClick={onClose}
        className="sticker absolute top-4 right-4 z-10 flex size-11 items-center justify-center bg-paper-light text-ink transition-transform hover:rotate-6"
      >
        <X className="rough" />
      </button>
      <motion.div
        className="polaroid max-h-full max-w-full p-3 pb-10"
        onClick={(event) => event.stopPropagation()}
        initial={{ scale: 0.7, rotate: -10, y: 30 }}
        animate={{ scale: 1, rotate: -1.5, y: 0 }}
        exit={{ scale: 0.8, rotate: 6, opacity: 0 }}
        transition={springs.viewer}
      >
        <Tape angle={-4} className="h-7 w-28" />
        <img src={src} alt={alt} className="block max-h-[calc(100svh-9rem)] max-w-full object-contain" />
      </motion.div>
    </motion.div>,
    document.body,
  )
}
