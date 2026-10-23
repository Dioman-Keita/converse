# Converse architecture

Self-hosted realtime chat. One `docker compose up` on any machine; public access
through an outbound Cloudflare Tunnel (no router / port-forwarding needed).

```
Web app (browser, iOS users)  ─┐
Android app (separate project) ─┼─ HTTPS / WSS ─→ Cloudflare Tunnel
                                │                        ↑ outbound
                                │   ┌──── docker compose ┼─────────────┐
                                │   │ tunnel  (cloudflared, profile)   │
                                └──→│ app     (TanStack Start + Nitro) │
                                    │           /api/*  REST           │
                                    │           /ws     WebSocket      │
                                    │ db      (Postgres 17, internal)  │
                                    │ backup  (pg_dump → ./backups)    │
                                    └──────────────────────────────────┘
```

## Repository layout

```
src/            # web client — Feature-Sliced Design
  app/          # providers, global shell wiring
  pages/        # route compositions (login, register, home, future chat)
  widgets/      # composite UI blocks (chat-shell, …)
  features/     # user actions (auth forms, send-message, start-call)
  entities/     # domain models (user, room, message, call)
  shared/       # ui kit, lib
routes/         # TanStack file routes — thin adapters only
server/         # Nitro server (serverDir)
  api/          # REST handlers → /api/*
  routes/ws.ts  # realtime WebSocket → /ws
  db/           # Drizzle schema, client, migrations
  plugins/      # startup hooks (migrations)
  utils/        # auth, realtime hub, message posting
```

FSD import rule: `app → pages → widgets → features → entities → shared`.

## Server

| Concern | Implementation |
| --- | --- |
| Database | Postgres 17 + Drizzle ORM (`server/db/schema.ts`) |
| Migrations | `npm run db:generate` → applied automatically on server start |
| Auth | scrypt passwords, opaque session tokens (SHA-256 stored) |
| Session transport | `converse_session` cookie (web) or `Authorization: Bearer` (Android) |
| Realtime | Nitro WebSocket + in-memory room hub (single process) |
| Voice notes | Browser MediaRecorder → raw upload → ffmpeg to mono AAC/M4A (`server/utils/voice.ts`) → `uploads` volume |
| Backups | `backup` service every 24 h, keeps 7: `pg_dump -Fc` + tar.gz of the `uploads` volume |

### REST

| Method | Path | Body / query |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ name, email, password }` → `{ user, token }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| POST | `/api/auth/logout` | — |
| GET | `/api/auth/me` | — |
| GET | `/api/rooms` | — |
| POST | `/api/rooms` | `{ type: "direct" \| "group", memberEmails, name? }` → `{ room, created }` (direct reuses an existing room; group needs `name`) |
| GET | `/api/rooms/:id/messages` | `?before=<nextCursor>&limit=50` → `{ messages, nextCursor }` (newest first) |
| POST | `/api/rooms/:id/messages` | `{ body, clientId? }` |
| POST | `/api/rooms/:id/voice` | raw audio body (`audio/*`, ≤ 10 MB, 0.3 s–5 min), `?clientId=` → `{ message }` |
| GET | `/api/media/:messageId` | voice audio (`audio/mp4`), room members only, supports `Range` (needed by iOS Safari) |

### WebSocket `/ws`

Client → server:

```jsonc
{ "type": "subscribe",   "roomId": "…" }
{ "type": "unsubscribe", "roomId": "…" }
{ "type": "send",        "roomId": "…", "body": "Hi", "clientId": "local-uuid" }
{ "type": "typing",      "roomId": "…", "typing": true }
```

Server → client:

```jsonc
{ "type": "ready", "userId": "…" }
{ "type": "subscribed", "roomId": "…" }
{ "type": "message", "message": { "id", "roomId", "authorId", "kind": "text", "body", "createdAt" }, "clientId": "…" }
{ "type": "message", "message": { "id", "roomId", "authorId", "kind": "voice", "body": "", "voice": { "url": "/api/media/…", "durationMs": 4200 }, "createdAt" } }
{ "type": "room", "room": { "id", "name", "type", "createdAt", "lastMessageAt", "members": [{ "id", "name", "email", "online", "lastSeenAt" }] } }
{ "type": "presence", "userId": "…", "online": false, "lastSeenAt": "2026-10-23T14:29:46.000Z" }
{ "type": "typing", "roomId": "…", "userId": "…", "typing": true }
{ "type": "error", "code": "forbidden", "message": "…", "clientId": "…" }
```

`clientId` lets the sender match the echo with its optimistic message.
`room` is pushed to every member when a conversation they belong to is created; clients then `subscribe` to it.

**Presence.** A user is online while at least one of their sockets is open (any tab or device). On the first connect and the last disconnect the server stamps `users.last_seen_at` and sends `presence` to every user who shares a room with them. Room members (`GET /api/rooms`, `room` event) carry `online` and `lastSeenAt` as a snapshot; `presence` events keep it current.

**Typing.** While the composer has text, clients send `typing: true` at most every 3 s and `typing: false` when it is emptied, on send, or after 4 s without keystrokes. The server relays it to the room's subscribers (including the sender's own sockets, which ignore their own `userId`). Receivers drop a signal not refreshed within 6 s, and clear it when that user's message arrives or they go offline.
Types live in `server/utils/hub.ts` (contract shared with the Android app).

## Clients

| Client | Notes |
| --- | --- |
| Web (`src/`) | For iOS and desktop users. Same origin → cookie auth. `/chat` is client-only (`ssr: false`), subscribes to every room, reconnects with backoff and resyncs history after a reconnect. |
| Android | Separate project. Bearer token, reconnects `/ws` on foreground. No push notifications. |

## Constraints (by design)

- Single `app` instance: the realtime hub is in memory. Scaling out → Postgres `LISTEN/NOTIFY`.
- The server is offline when the host machine is off.
- Postgres has no published port; only `app` talks to it.
- Calls (future): signaling over `/ws`, media needs a TURN/SFU (WebRTC does not go through the tunnel).

## Operations

```bash
cp .env.example .env                    # set DB_PASSWORD (+ TUNNEL_TOKEN)
docker compose up -d                    # local: http://localhost:3000
docker compose --profile quick-tunnel up -d   # temporary public URL, no account
docker compose logs quick-tunnel | grep trycloudflare.com
docker compose --profile tunnel up -d   # stable public URL via your domain
```

Move to another machine: copy the repo + `.env`, `docker compose up -d`, then restore:

```bash
docker compose exec -T db pg_restore -U converse -d converse --clean < backups/<file>.dump
```
