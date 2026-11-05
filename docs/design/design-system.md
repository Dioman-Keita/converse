# Design system

Practical reference to build or change an interface. The *why* is in [art-direction.md](art-direction.md).

- Tokens and materials: [`src/styles.css`](../../src/styles.css) (sections `/* ---------- Name ---------- */`).
- Reusable primitives: [`src/shared/ui/`](../../src/shared/ui/) (FSD `shared` layer, exported from `@/shared/ui`).
- Motion tokens: [`src/shared/lib/motion.ts`](../../src/shared/lib/motion.ts).
- Deterministic decoration: [`src/shared/lib/seeded.ts`](../../src/shared/lib/seeded.ts).

**Rule #1: reuse before creating.** A new screen is assembled from the bricks below. If one is
missing, create it in `shared/ui` in the same spirit and document it here.

---

## 1. Tokens

CSS variables on `:root`, exposed to Tailwind through `@theme inline` (`bg-paper`, `text-ink`,
`bg-yellow`, …). **Always use the token**, never the raw value. The shadcn semantic tokens
(`--background`, `--primary`, …) are mapped onto the palette so third-party shadcn components fit in.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#f3ead6` | Pages |
| `--paper-light` | `#faf5e8` | Scraps laid on a page (cards, notes, fields) |
| `--paper-edge` | `#dccdab` | Default border, discreet separations |
| `--polaroid` | `#fbfaf5` | Polaroid frame |
| `--tape` | `rgb(238 224 180 / .82)` | Masking tape |
| `--desk` | `#1b222d` | App background, `theme-color` |
| `--ink` | `#33302b` | Text, sticker borders |
| `--ink-soft` | `#6f675b` | Secondary text, timestamps, hints |
| `--pink-ink` | `#c43d78` | Group author names, typing, unread room title |
| `--error-ink` | `#b5302c` | Errors ("✗ …") |
| `--pink` / `--pink-wash` | `#ef6fa6` / `#f7a8c9` | Focus ring, own notes, pink sticker |
| `--blue` / `--blue-wash` | `#5fbfe6` / `#9fd8f0` | Others' notes, blue sticker |
| `--yellow` | `#f6df4f` | Primary sticker, stars, marker, unread sticker |
| `--orange`, `--lilac`, `--green` | | Watercolor stains; green = online |
| `--cover-a` / `--cover-b` | `#47597a` / `#2d3a52` | Notebook cover |
| `--radius-hand` / `--radius-hand-alt` | `14px 10px 16px 9px` / `10px 16px 9px 14px` | Uneven corners |
| `--shadow-paper`, `--shadow-lift`, `--shadow-sticker`, `--shadow-desk` | | Depth of each material |

Watercolor inks for JS (avatars, stains) live in `shared/lib/watercolor.ts` and mirror the CSS tokens.

## 2. Typography

| Utility | Font | Use |
| --- | --- | --- |
| `font-sans` (default) | Patrick Hand | All text |
| `font-title` | Gochi Hand | Titles, names, dates, labels, big buttons |

- Self-hosted through Fontsource (`@fontsource/patrick-hand`, `@fontsource/gochi-hand`), never Google Fonts.
- The Tailwind scale is **raised** in `@theme` (`text-xs` 15 px … `text-2xl` 28 px) because handwriting
  reads smaller than a UI sans. Keep using the normal utilities.
- Emojis fall back to the system color emoji font.

## 3. Materials (CSS classes, `@layer components`)

| Class | What | Where |
| --- | --- | --- |
| `.desk` | Fixed dusk background + vignette | `Desk` |
| `.paper`, `.paper-light`, `.paper-lined`, `.paper-margin` | Paper grain, lighter scrap, 30 px writing lines, pink margin | `Paper`, `Card` |
| `.blob`, `.splash` | Watercolor stain (`#watercolor`, `multiply`) and splashes | `Paper` decoration |
| `.notebook-cover`, `.notebook-spine` | Cover and fold between pages | `NotebookCover`, `ChatShell` |
| `.torn` / `.torn-wrap` | Torn paper (`clip-path`) + drop shadow | `TornLabel` |
| `.tape` | Masking tape strip | `Tape` |
| `.note`, `.note-mine`, `.note-theirs`, `.note-failed` | Message notes (pink / blue wash, dashed red when failed) | `MessageItem`, `FileAttachment`, composer |
| `.sticker` | Inked border + offset shadow + uneven corners | `Button`, `StickerChoice`, `UnreadSticker` |
| `.highlighter` | Yellow marker swipe | Active room |
| `.polaroid`, `.developing` | Photo frame; "developing" gradient while a video is processed | `MediaAttachment`, `Lightbox` |
| `.hand-field`, `.hand-lines` | Field = inked line; lined writing area | `Input`, composer |
| `.rough` | Hand-drawn wobble on an SVG/icon | Icons |

The SVG filters `#watercolor` and `#rough` are declared once by `<ScrapbookFilters />` (app providers).

⚠️ Prefer **tiled gradients** (`background-size`) to `repeating-linear-gradient`: the latter drops lines at some zoom levels.

## 4. Components

| Component | Layer / file | Use for |
| --- | --- | --- |
| `Desk` | `shared/ui/desk.tsx` | Background of every full screen (renders the butterfly) |
| `NotebookCover` | `shared/ui/notebook-cover.tsx` | Closed notebook: home, sign-in, sign-up |
| `Paper` (`seed`, `lined`, `margin`, `light`, `stains`, `as`) | `shared/ui/paper.tsx` | Any page. `seed` fixes the stains (user id, room id) |
| `TornLabel` (`tilt`) | `shared/ui/torn-label.tsx` | Titles: room name, "Conversations", "Settings", day separators |
| `Tape` (`placement`, `angle`) | `shared/ui/tape.tsx` | Holding cards, polaroids, documents |
| `Star` | `shared/ui/star.tsx` | Something special (cover, empty conversation). Sparingly |
| `Butterfly` | `shared/ui/butterfly.tsx` | Unique and global (through `Desk`). Don't add others |
| `Button` (`default` yellow, `pink`, `secondary` blue, `outline` paper, `ghost`, `destructive`, `link`) | `shared/ui/button.tsx` | Actions. `ghost` for toolbar icons, `link` for secondary text actions |
| `Card` (`tape`, `tilt`) | `shared/ui/card.tsx` | A taped scrap: forms, settings sections |
| `Input`, `Label` | `shared/ui` | Fields written on a line |
| `StickerChoice` | `shared/ui/sticker-choice.tsx` | One choice among a few (radio group); the yellow sticker slides |
| `Avatar` | `widgets/chat-shell/ui/avatar.tsx` | Watercolor dab circled in ink + initials; green sticker when online |
| `UnreadSticker` | `widgets/chat-shell/ui/unread-sticker.tsx` | Unread count |
| `MessageItem` | `widgets/chat-shell/ui/message-item.tsx` | One message (note, polaroid, document, voice) |
| `TypingScribble` | `widgets/chat-shell/ui/typing-scribble.tsx` | "is typing…" |

Status messages are written **in the page**, in `text-ink-soft` ("Saved ✓") or `text-error-ink`
("✗ …"). Never a toast.

## 5. Layout

- **Notebook** (`ChatShell`): max 1320 px wide, full height; left page 22–24 rem, fold, right page.
  Below `md` (768 px): one page at a time, no cover margin.
- Nothing covers a page: the composer is part of the page, the lightbox is portaled to `<body>`.
- Tilt ranges: readable notes ±0.9°, polaroids ±2.5°, labels ±3°, cards ±1.5° (and a card on a
  rotated cover compensates the cover's angle).

## 6. Motion

Library: **Motion** (`motion/react`), wrapped in `<MotionConfig reducedMotion="user">`. Use the
spring tokens from `shared/lib/motion.ts`; don't inline new stiffness/damping values.

| Gesture | Token | Where |
| --- | --- | --- |
| Turn a page (open a conversation, switch side panel) | `springs.pageTurn`, `rotateY ±14°`, `x ±28` | `ChatShell` |
| Lay a note down (new message) | `springs.note`, from `y 16`, `scale .94`, `rotate tilt±5` | `MessageItem` |
| Drop a polaroid | `springs.polaroid`; hover `lift` (straightens) | `MessageItem` |
| Stick a label | `springs.label`, slides from the left with rotation | `TornLabel` |
| Pop a star / sticker | `springs.pop`, `scale 0 → 1`, `rotate −40 → 0` | `Star`, `UnreadSticker`, online dot, mic ↔ send |
| Slide the active marker / sticker | `springs.nudge` + `layoutId` | `RoomList`, `StickerChoice` |
| Reorder the index | `layout="position"` + `springs.nudge` | `RoomList` |
| Open the viewer | `springs.viewer`, from `scale .7`, `rotate −10` | `Lightbox` |
| Write a line | `clipPath inset(0 100% 0 0) → inset(0)` | "Saved ✓" |
| Scribble while typing | `pathLength 0 → 1`, 1.6 s loop | `TypingScribble` |
| Butterfly | 16 s crossing, every 45–105 s | `Butterfly` |

Rules:

- Springs rather than durations; no permanently visible loop (except the butterfly, rare, and
  transient states: typing, video developing, voice playing).
- **History doesn't animate**: `MessageList` uses `AnimatePresence initial={false}`, so only messages
  arriving after the page opened are laid down with a gesture.
- Nothing moves under the user's cursor while they type.
- Every CSS animation has its `@media (prefers-reduced-motion: reduce)` variant.

## 7. Checklist before shipping an interface

- [ ] Only tokens and the two handwritten fonts
- [ ] Built from existing primitives (paper, label, tape, sticker, polaroid, card)
- [ ] At least one deliberate imperfection (tilt, torn edge), but legible
- [ ] Works below 768 px and on touch (nothing depends on hover)
- [ ] Spring animations from `shared/lib/motion.ts`, `prefers-reduced-motion` respected
- [ ] Texts in English **and** French (`src/shared/i18n/dictionaries.ts`)
- [ ] Captures updated in `docs/design/screenshots/` when a screen changes
