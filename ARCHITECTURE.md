# Converse architecture

Feature-Sliced Design (FSD) + Convex-ready realtime core.

## Layers

```
src/
  app/          # providers, global shell wiring
  pages/        # route compositions (login, register, home, future chat)
  widgets/      # composite UI blocks (chat-shell, …)
  features/     # user actions (auth forms, send-message, start-call)
  entities/     # domain models (user, room, message, call)
  shared/       # ui kit, lib, api client, config
routes/         # TanStack file routes — thin adapters only
convex/         # Convex schema & functions (realtime backend)
```

Import rule: higher layers may import lower ones only  
`app → pages → widgets → features → entities → shared`

## Auth (current)

| Slice | Role |
| --- | --- |
| `features/auth` | Login / register forms (ElevenLabs UI style) |
| `pages/auth` | Page shell + mode switch |
| `routes/login`, `routes/register` | File routes |

## Realtime roadmap (Convex)

1. Install: `bun add convex` then `bunx convex dev`
2. Set `VITE_CONVEX_URL`
3. Uncomment `convex/schema.ts` tables (`users`, `rooms`, `messages`, `calls`)
4. Mount `ConvexProvider` in `app/providers`
5. Add entity/feature API hooks:
   - `entities/message` → `useRoomMessages`
   - `features/send-message` → mutation
   - `features/start-call` → signaling docs + SFU (LiveKit/WebRTC)

### Responsibility split

| Concern | Owner |
| --- | --- |
| Message fan-out / presence | Convex queries + subscriptions |
| Call signaling | Convex `calls` table |
| Media (audio/video) | External SFU — not Convex |
| Auth session | Convex Auth or external IdP → `entities/user` |

## UI

Shared primitives live in `shared/ui` (shadcn base-nova / ElevenLabs registry style).  
No Tailwind class prefix. Theme tokens in `src/styles.css` (dark-first).
