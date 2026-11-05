# Art direction

> Read before any visible change to the web client. The *how* (tokens, components, motion) is in
> [design-system.md](design-system.md).

## The idea in one sentence

**A correspondence notebook left open on a desk at dusk**: cream paper, watercolor washes, notes
laid on the page, taped polaroids, handwriting, a few yellow stars, and a blue butterfly that
crosses the screen once in a while.

Every element is a **physical object** (a sheet, a scrap, a strip of tape, a photo, a sticker, a
torn label) rather than a widget. A conversation is a page of the notebook; a message is a note
laid on that page.

## Inspiration, and its limit

The mood is inspired by the hand-made journals of narrative games such as *Life is Strange*
(Dontnod / Square Enix): scrapbook, pastel watercolor, handwriting, paper tabs. The same direction
is already used by the [to-do-list-app](https://github.com/Dioman-Keita/to-do-list-app) journal,
which Converse shares its vocabulary with.

This is an **unofficial, fan-inspired** style. Strict rules:

- **No asset from any game**: no images, captures, fonts, sounds, logos, character or place names
  in the interface, the code or the demo data.
- Everything is **recreated** in CSS, SVG or code. Fonts are free (OFL): Patrick Hand, Gochi Hand.
- We borrow a *mood*, never a specific screen.

## The five pillars

1. **Paper first.** Desk-dark background, cream textured pages (`--noise`), pale blue lines and a
   pink margin on the conversation page. Content is *laid on* the paper: soft shadows, slight
   rotations.
2. **Deliberate imperfection.** Nothing is perfectly straight or round: uneven corners
   (`--radius-hand`), torn edges, ragged watercolor stains (`#watercolor`), wobbly strokes
   (`#rough`). Each object keeps the same small tilt forever (seeded by its id).
3. **Handwriting.** Two handwritten fonts only: Patrick Hand (text) and Gochi Hand (titles, names,
   dates). The type scale is raised so handwriting stays as legible as a UI sans.
4. **Watercolor color.** Pink, sky blue, yellow, orange, lilac, green, always diluted
   (`mix-blend-mode: multiply`, low opacity). Saturated colors are only for small accents (a star, a
   sticker, pink ink).
5. **The gesture, not the effect.** Animations imitate gestures: a page that turns, a note laid
   down, a polaroid dropped, a sticker stuck on, a line written. Soft springs, never a corporate fade
   or an exaggerated bounce.

## The scene

```
┌──────────────────────────── desk (dark blue, blurred dusk light) ─────────────────────────────┐
│ ┌──────────────────────────── notebook cover (blue, watercolor) ────────────────────────────┐ │
│ │ ┌──── left page: the index ────┐┃┌──────── right page: the open conversation ─────────┐ │ │
│ │ │ (avatar) Name · ● online  ⊕⚙⇥│┃│ (avatar) [torn label: Awa · online]                 │ │ │
│ │ │ [torn label: Conversations]   │┃│                  [torn label: Today]               │ │ │
│ │ │ ▓ yellow marker on the open  ▓│┃│ ┌note (blue wash)┐                                  │ │ │
│ │ │   Moussa            13:11 (★3)│┃│                        ┌note (pink wash, mine)┐     │ │ │
│ │ │   Weekend trip      13:11     │┃│                ┌─tape─┐ polaroid, tilted           │ │ │
│ │ │ (scraps: new conversation,    │┃│ ~~~ pencil scribble ~~~ Awa is typing…             │ │ │
│ │ │  settings — taped)            │┃│ [lined scrap: 📎 🖼  write…               (🎤|→)]   │ │ │
│ │ └───────────────────────────────┘┃└────────────────────────────────────────────────────┘ │ │
│ └──────────────────────────────── fold ┃ ─────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Desk**: almost-black blue, blurred and vignetted. Never the star.
- **Notebook**: two pages on desktop (index + conversation), one page at a time on mobile.
- **Cover**: seen alone, closed and askew, on the home, sign-in and sign-up screens.
- Each conversation page has its own watercolor stains, generated from the room id (same room, same
  stains, on every visit).

## Do / don't

| ✅ Do | ❌ Don't |
| --- | --- |
| Torn paper label for a title, a date, a room name | Full-width app header bar |
| Sticker button (inked border, offset shadow) | Flat or "material" button |
| Yellow sticker that pops for an unread count | Red notification badge |
| Message written in the page ("Saved ✓", "✗ Not sent") | Toast, snackbar, system alert |
| Small, irregular, stable tilt | Everything perfectly aligned |
| Diluted colors, `multiply` | Saturated flat colors, neon gradients |
| Lucide icons with the `#rough` wobble | Perfectly crisp icon strokes |
| One rare blue butterfly | Confetti, particles, permanent loops |

## Accessibility: non-negotiable

Style never wins over legibility:

- Message text is 19 px (`text-base`, raised scale), high ink/paper contrast (`--ink` on `--paper`).
- Tilts on readable text stay within ±1°; up to ±2.5° for polaroids.
- Every animation respects `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` + CSS rules).
- Decorative elements are `aria-hidden`; choices are real radio groups (`StickerChoice`).
- Visible keyboard focus (`outline: 2px dashed var(--pink)`), never removed without a replacement.
- On touch screens nothing essential depends on hover.
