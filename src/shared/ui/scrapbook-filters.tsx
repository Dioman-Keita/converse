/**
 * SVG filters shared by the whole app, rendered once (app providers):
 * - `#watercolor`: ragged edges of watercolor stains;
 * - `#rough`: hand-drawn wobble on strokes (icons, stars, avatars).
 */
export function ScrapbookFilters() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>
        <filter id="watercolor" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.022" numOctaves="4" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="70" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" />
        </filter>
      </defs>
    </svg>
  )
}
