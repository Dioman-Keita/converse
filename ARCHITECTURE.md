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
| Backups | `backup` service: `pg_dump -Fc` every 24 h, keeps 7 |

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

### WebSocket `/ws`

Client → server:

```jsonc
{ "type": "subscribe",   "roomId": "…" }
{ "type": "unsubscribe", "roomId": "…" }
{ "type": "send",        "roomId": "…", "body": "Hi", "clientId": "local-uuid" }
```

Server → client:

```jsonc
{ "type": "ready", "userId": "…" }
{ "type": "subscribed", "roomId": "…" }
{ "type": "message", "message": { "id", "roomId", "authorId", "body", "createdAt" }, "clientId": "…" }
{ "type": "room", "room": { "id", "name", "type", "createdAt", "lastMessageAt", "members": [{ "id", "name", "email" }] } }
{ "type": "error", "code": "forbidden", "message": "…", "clientId": "…" }
```

`clientId` lets the sender match the echo with its optimistic message.
`room` is pushed to every member when a conversation they belong to is created; clients then `subscribe` to it.
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
