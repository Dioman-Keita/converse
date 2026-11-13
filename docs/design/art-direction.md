# Art direction

## Intent

Converse is a **professional chat**: a tool people keep open all day next to their work.
The interface stays out of the way so the conversation is the only thing that matters.

The look borrows from developer tools such as Vercel's dashboard and the Geist design language:
a black canvas, hairline borders, one typeface family, a single blue accent, and motion that
explains rather than decorates.

## Pillars

1. **Dark and quiet.** Pure black (`#000`) background, surfaces stepping up in very small
   increments (`#0a0a0a`, `#111`, `#171717`). Separation comes from 1 px translucent hairlines,
   not from shadows or color blocks.
2. **Type does the work.** Geist Sans for everything people read, Geist Mono for machine-ish
   data: timestamps, counts, file sizes, keyboard hints, day separators. Headings are tight
   (negative tracking), body text is 13–15 px, nothing is bold without a reason.
3. **One accent, used for meaning.** Blue means *new or active*: unread badges, typing,
   focus rings, links. Green is only presence and success, red only errors and recording.
   The primary button is light on black, never blue.
4. **Motion is fast and functional.** Things fade up into place with a little blur, indicators
   slide between positions (`layoutId`), lists stagger in. Ease-out curves, 150–600 ms,
   springs without bounce. Everything respects *reduce motion*.
5. **Messages first.** Own messages are inverted (light bubble, dark text) on the right; others
   are a raised dark surface on the left. Runs by the same author share one tail and one
   timestamp so a busy thread stays readable.

## Do / don't

| Do | Don't |
| --- | --- |
| Use the gray scale tokens and hairlines | Introduce new grays or opaque borders |
| Put numbers and times in Geist Mono with `tabular-nums` | Mix in another font |
| Keep one primary (light) button per view | Use colored buttons for ordinary actions |
| Animate opacity, position, scale and blur | Bounce, rotate or shake for decoration |
| Show loading with skeletons or the spinner | Leave empty space while data loads |
| Write short, plain labels | Add metaphors or jokes to the UI copy |
