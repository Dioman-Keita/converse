import { X } from "lucide-react"
import { useEffect, useRef } from "react"

import { useI18n } from "@/shared/i18n"

type LightboxProps = { src: string; alt: string; onClose: () => void }

/** Full-screen photo viewer: Escape, the close button or a click outside closes it. */
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in"
      onClick={onClose}
    >
      <button
        ref={close}
        type="button"
        aria-label={t("media.close")}
        onClick={onClose}
        className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X />
      </button>
      <img
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
      />
    </div>
  )
}
