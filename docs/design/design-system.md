# Design system

Practical reference to build or change an interface. The *why* is in [art-direction.md](art-direction.md).

- Tokens: [`src/styles.css`](../../src/styles.css).
- Reusable primitives: [`src/shared/ui/`](../../src/shared/ui/) (FSD `shared` layer, exported from `@/shared/ui`).
- Motion tokens: [`src/shared/lib/motion.ts`](../../src/shared/lib/motion.ts).
- Avatar gradients: [`src/shared/lib/seeded.ts`](../../src/shared/lib/seeded.ts) (`gradientFor(seed)`).

**Rule #1: reuse before creating.** A new screen is assembled from the bricks below. If one is
missing, create it in `shared/ui` in the same spirit and document it here.

---

## 1. Tokens

CSS variables on `:root`, exposed to Tailwind through `@theme inline` (`bg-gray-50`,
`border-hairline`, `text-blue`, …). **Always use the token**, never the raw value. The shadcn
semantic tokens (`--background`, `--primary`, …) are mapped onto the palette.

| Token | Value | Use |
| --- | --- | --- |
| `--gray-0` | `#000` | Canvas, conversation background, fields |
| `--gray-50` | `#0a0a0a` | Sidebar, cards, composer |
| `--gray-100` | `#111` | Hover, raised controls |
| `--gray-200` | `#171717` | Active row, others' bubbles |
| `--gray-300`–`500` | `#1f1f1f`–`#454545` | Strong hover, scrollbar, borders on hover |
| `--gray-600` | `#6e6e6e` | Placeholders, timestamps, section labels |
| `--gray-700` | `#8f8f8f` | Secondary text |
| `--gray-800` | `#a1a1a1` | Field labels |
| `--gray-900` | `#ededed` | Primary text, primary button, own bubbles |
| `--hairline` | `rgb(255 255 255 / .08)` | Default border |
| `--hairline-strong` | `rgb(255 255 255 / .14)` | Fields, buttons, active row |
| `--blue` / `--blue-strong` | `#3291ff` / `#0a72ef` | Unread, typing, links, focus ring |
| `--green` | `#3ecf8e` | Presence, success |
| `--amber` | `#f5a524` | Connecting |
| `--red` / `--red-soft` | `#ff5b5b` / 12 % | Errors, recording |

Shadows: `shadow-sm` (buttons, fields), `shadow-md` (composer, popovers), `shadow-lg` (hero
cards, viewer), `shadow-focus` (the focus ring, also applied by `:focus-visible`).

## 2. Type

- **Geist Variable** (`font-sans`) for all UI text. **Geist Mono Variable** (`font-mono`) for
  timestamps, counts, sizes, durations, keyboard hints and day separators — always with `tabular-nums`.
- Scale: 11 px (meta, mono) · 12–13 px (secondary, labels) · 14–14.5 px (body, messages) ·
  16 px (panel titles) · 20 px (card titles) · 36–60 px (home headline).
- Headings: `font-semibold` with negative tracking (`tracking-[-0.01em]` to `-0.045em` as size grows).
- Section labels: 11 px, `uppercase`, `tracking-wider`, `text-gray-600`.

## 3. Components (`@/shared/ui`)

| Component | Notes |
| --- | --- |
| `Button` | Variants `default` (light, the one primary action), `secondary`, `outline`, `ghost` (toolbars; `aria-pressed` shows the active state), `accent`, `destructive`, `link`. Sizes `xs`–`lg`, `icon*`. Press scales to 0.98. |
| `Input`, `Label` | 40 px field (36 px in compact panels via `h-9`), hairline border, blue focus ring. |
| `Card` | `bg-gray-50`, hairline border, `rounded-xl`. `lit` swaps the border for a top-lit gradient edge + `shadow-lg` (auth card). |
| `Segmented` | One choice among a few; a raised pill slides under the selection (`name` must be unique per screen). |
| `Spinner` | Twelve ticks, inherits `currentColor`. Use inside buttons while pending. |
| `TypingDots` | Three rising dots in a bubble. |
| `Logo` | Mark + optional wordmark. |
| `Backdrop` | Full-screen grid, top glow and travelling light beams for standalone screens (home, auth). |

CSS helpers in `styles.css`: `.grid-backdrop`, `.top-glow`, `.edge-light`, `.shimmer` (skeletons), `.text-sheen`.

## 4. Layout

- **Chat**: sidebar (`md:w-80`, `lg:w-[22rem]`, `bg-gray-50`, `border-r`) with a 56 px header
  (logo, new conversation, settings), search (`Ctrl/⌘ K`), the conversation list and a 56 px
  account footer; the thread on the right with a 56 px blurred header, messages capped at
  `max-w-3xl`, and the floating composer. On mobile one column at a time.
- **Messages**: mine `bg-bubble-mine` right, theirs `bg-bubble-theirs` left, `rounded-[18px]`;
  the last bubble of a run gets the small tail corner (`rounded-br-md` / `rounded-bl-md`) and
  the timestamp. A run = same author within 5 minutes. Groups show the author's name at the start
  of a run and the avatar at its end. Photos and videos: `rounded-2xl` with a hairline border.
- **Standalone screens** (home, sign-in): `Backdrop`, a 64 px header with the logo, centered content.

## 5. Motion (`@/shared/lib/motion`)

| Token | Use |
| --- | --- |
| `transitions.fast` (150 ms) | Hover, icon swaps, status text |
| `transitions.base` (300 ms) | Panels, list items, errors, height changes |
| `transitions.slow` (600 ms) | Page entrances |
| `springs.indicator` | Sliding highlights (`layoutId`): active conversation, segmented control |
| `springs.layout` | Rows moving to their new place |
| `springs.pop` | Badges, presence dots, the send/mic swap |
| `springs.dialog` | New messages, the photo viewer |
| `fadeUp`, `slideIn`, `stagger(i)` | Entrance presets |

All curves are ease-out (`easeOut` = `[0.16, 1, 0.3, 1]`); no bounce, no rotation.
`MotionConfig reducedMotion="user"` and the CSS media query turn motion off when the system asks.

## 6. Checklist for a change

- [ ] Only tokens (no raw hex), hairline borders, Geist / Geist Mono.
- [ ] One primary button per view; blue only for meaning (new, active, focus, link).
- [ ] Loading, empty and error states designed (skeleton or spinner, short message, a next action).
- [ ] Keyboard: visible focus ring, `aria-label` on icon buttons, Escape closes overlays.
- [ ] Motion uses the tokens above and still makes sense with reduce motion.
- [ ] Strings in both `en` and `fr` (`src/shared/i18n/dictionaries.ts`).
- [ ] Phone width checked (sidebar and thread are separate screens).
