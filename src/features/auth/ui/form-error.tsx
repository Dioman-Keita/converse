import { CircleAlert } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { transitions } from "@/shared/lib/motion"

/** Inline error under the fields — never a toast. The height animates so the form doesn't jump. */
export function FormError({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="error"
          className="overflow-hidden"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={transitions.base}
        >
          <p
            role="alert"
            className="m-0 flex items-start gap-2 rounded-md border border-red/25 bg-red-soft px-3 py-2 text-[13px] text-red"
          >
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
            {message}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
