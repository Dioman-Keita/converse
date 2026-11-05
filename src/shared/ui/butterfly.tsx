import { motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"

type Flight = { id: number; x: number[]; y: number[]; flip: 1 | -1 }

const FIRST_FLIGHT_MS = 6_000
const MIN_GAP_MS = 45_000
const MAX_EXTRA_GAP_MS = 60_000

function plan(id: number): Flight {
  const w = window.innerWidth
  const h = window.innerHeight
  const ltr = id % 2 === 1
  const xs = [-80, w * 0.25, w * 0.5, w * 0.75, w + 80]
  const ys = xs.map(() => h * (0.1 + Math.random() * 0.75))
  return { id, x: ltr ? xs : [...xs].reverse(), y: ys, flip: ltr ? 1 : -1 }
}

/**
 * A small blue butterfly that crosses the screen once in a while.
 * Rare on purpose (one flight every 45–105 s), never with reduced motion, never clickable.
 */
export function Butterfly() {
  const reduce = useReducedMotion()
  const [flight, setFlight] = useState<Flight | null>(null)

  useEffect(() => {
    if (reduce) return
    let count = 0
    let timer: ReturnType<typeof setTimeout>
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        count += 1
        setFlight(plan(count))
        schedule(MIN_GAP_MS + Math.random() * MAX_EXTRA_GAP_MS)
      }, delay)
    }
    schedule(FIRST_FLIGHT_MS)
    return () => clearTimeout(timer)
  }, [reduce])

  if (reduce || !flight) return null

  return (
    <motion.div
      key={flight.id}
      className="pointer-events-none fixed top-0 left-0 z-[60] drop-shadow-[0_6px_6px_rgb(0_0_0/0.35)]"
      initial={{ x: flight.x[0], y: flight.y[0], opacity: 0 }}
      animate={{ x: flight.x, y: flight.y, opacity: [0, 1, 1, 1, 0], rotate: [10, -15, 12, -10, 5] }}
      transition={{ duration: 16, ease: "easeInOut" }}
      style={{ scaleX: flight.flip }}
      aria-hidden
    >
      <svg width="46" height="46" viewBox="-30 -30 60 60">
        <defs>
          <linearGradient id="butterfly-wing" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#bfe9ff" />
            <stop offset="0.55" stopColor="#3d9be0" />
            <stop offset="1" stopColor="#1b4f9c" />
          </linearGradient>
        </defs>
        <g transform="rotate(90)">
          <motion.g
            animate={{ scaleX: [1, 0.25, 1] }}
            transition={{ duration: 0.32, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M0 -2 C -18 -26, -30 -6, -16 2 C -26 10, -16 24, 0 6 Z" fill="url(#butterfly-wing)" stroke="#11233d" strokeWidth="1.6" />
            <path d="M0 -2 C 18 -26, 30 -6, 16 2 C 26 10, 16 24, 0 6 Z" fill="url(#butterfly-wing)" stroke="#11233d" strokeWidth="1.6" />
          </motion.g>
          <ellipse cx="0" cy="2" rx="1.8" ry="11" fill="#11233d" />
          <path d="M0 -8 q -4 -8 -7 -10 M0 -8 q 4 -8 7 -10" stroke="#11233d" strokeWidth="1.2" fill="none" />
        </g>
      </svg>
    </motion.div>
  )
}
