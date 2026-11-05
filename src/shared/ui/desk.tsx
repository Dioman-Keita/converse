import { Butterfly } from "./butterfly"

/** The dark desk the notebook lies on: fixed, blurred, vignetted. Never the star of the page. */
export function Desk({ butterfly = true }: { butterfly?: boolean }) {
  return (
    <>
      <div className="desk" aria-hidden />
      {butterfly && <Butterfly />}
    </>
  )
}
