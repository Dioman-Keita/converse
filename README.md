# Converse

**Self-hosted** realtime chat: your PC (or any machine with Docker) is the server, and anyone on the Internet can use it from a browser.

- Accounts (email + password), direct and group conversations, realtime text, **voice**, **photo**, **video** and **document** messages, history.
- Online status, "last seen…" and "is typing…".
- Dark, professional web interface (Geist type, subtle motion) that works on phones and desktops, in **English** (default) or **French**.
- Conversation search (`Ctrl/⌘ K`), grouped messages, unread badges.
- Profile settings: display name and interface language, saved on your account.
- One command to run everything: `docker compose up -d`.
- All data stays with you (Postgres) with automatic daily backups.
- Public access **without touching your router**, through an outbound Cloudflare Tunnel.

Technical details (REST API, WebSocket protocol, design decisions): [ARCHITECTURE.md](ARCHITECTURE.md).
Visual design (art direction, design system, motion): [docs/design/](docs/design/README.md).

```
Browser (iOS, Android, desktop)
        │ HTTPS / WSS
        ▼
  Cloudflare Tunnel ◄── outbound connection from your PC (no open port)
        │
┌───────┴──────── docker compose (your PC) ────────┐
│ quick-tunnel / tunnel  → exposes the app         │
│ app      → website + API + WebSocket (Node 24)   │
│ db       → Postgres 17 (never exposed)           │
│ backup   → daily dumps into ./backups            │
└──────────────────────────────────────────────────┘
```

---

## Contents

1. [Requirements](#requirements)
2. [Run the server](#run-the-server)
3. [Make the app reachable from the Internet](#make-the-app-reachable-from-the-internet)
4. [Get a permanent URL](#get-a-permanent-url)
5. [Android app](#android-app)
6. [Using the app](#using-the-app)
7. [Day-to-day operations](#day-to-day-operations)
8. [Backups and restore](#backups-and-restore)
9. [Development](#development)
10. [Troubleshooting](#troubleshooting)
11. [Known limitations](#known-limitations)
12. [License](#license)

---

## Requirements

| Tool | Used for | Version |
| --- | --- | --- |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Running the server | recent |
| [Node.js](https://nodejs.org/) | Development only | **24 LTS** (see `.nvmrc`) |
| Git | Getting the code | — |

No Cloudflare account is needed to get started (Quick Tunnel).

---

## Run the server

```bash
git clone https://github.com/Dioman-Keita/converse.git
cd converse
cp .env.example .env
```

Open `.env` and replace `DB_PASSWORD=change-me` with a long random password. It is only used between containers; you will never type it.

```bash
docker compose up -d
```

The first start builds the image (a few minutes). Then:

- the app is available at **http://localhost:3000** (on your PC only);
- the database is created and migrated automatically on startup;
- a first backup is written to `./backups`.

Check that everything runs:

```bash
docker compose ps
```

---

## Make the app reachable from the Internet

### Quick option: Quick Tunnel (no account, no domain)

Use the start script: it starts everything, waits for the tunnel and **prints the public address** in the terminal.

Windows (PowerShell):

```powershell
.\start.ps1
```

Linux / macOS / Git Bash:

```bash
./start.sh
```

Add `-Build` (PowerShell) or `--build` (shell) after a `git pull` to rebuild the app. The server also prints the address in its logs every time it changes (`docker compose logs app`).

You get an address like `https://random-words.trycloudflare.com`: that's the one to share. It works over HTTPS, on mobile data as well as Wi-Fi, with nothing to configure on your router.

> ⚠️ **The address changes every time the tunnel restarts** (PC or Docker restart, `docker compose down`). You then have to share the new one. For a permanent address, see [Get a permanent URL](#get-a-permanent-url).

### Lasting option: named Cloudflare tunnel (your domain)

See the next section.

---

## Get a permanent URL

An address that never changes is needed to share a lasting link and for the upcoming Android app. **Something** on the Internet has to own a permanent address; here are the options, from most to least recommended.

### 1. A domain name + named Cloudflare tunnel — recommended

**Cost: ~€10/year for the domain. The tunnel stays free (Cloudflare Free plan).**

A named tunnel requires a domain whose DNS is managed by Cloudflare. You get an address like `https://chat.yourdomain.com`.

1. Buy a domain (e.g. through Cloudflare Registrar, sold at cost) or add a domain you already own to Cloudflare (**Free** plan).
2. In the Cloudflare dashboard: **Zero Trust → Networks → Tunnels → Create a tunnel** → type **Cloudflared**.
3. Name it (`converse`), then copy the displayed **token** (the long string after `--token`).
4. **Public Hostname** tab: subdomain `chat`, domain `yourdomain.com`, service `HTTP` → `app:3000`.
5. Paste the token into `.env`:
   ```
   TUNNEL_TOKEN=eyJhIjoi...
   ```
6. Start the `tunnel` profile (instead of `quick-tunnel`):
   ```bash
   docker compose --profile quick-tunnel down
   docker compose --profile tunnel up -d
   ```

`https://chat.yourdomain.com` stays the same forever, even if you move to another PC.

### 2. Tailscale Funnel — free, no domain (not integrated yet)

Tailscale offers a free permanent address like `https://my-pc.tailnet-name.ts.net`. It's the best **free, no-domain** option, but it isn't wired into `docker-compose.yml` yet and WebSocket support through Funnel still needs to be verified. The `ts.net` domain can't be customized.

### 3. ngrok (free static domain) — not recommended for the web app

ngrok offers a free static domain, but on the free plan **every visitor first sees an ngrok warning page** before reaching the app. Acceptable for a mobile app's API (it can be bypassed with a header), not for friends opening a link in their browser.

---

## Android app

Download `converse-x.y.z.apk` from the [releases](https://github.com/Dioman-Keita/converse/releases) on your phone and open it (Android 8+; allow installing apps from your browser when asked).

Every time it opens, the app asks for the **server address**: paste the one printed by the start script (the last one is pre-filled, and **Paste** takes it from the clipboard, even from a whole copied terminal line). It checks that a Converse server answers there, then opens the chat. Everything works as in the browser: voice messages (it asks for the microphone once), photos, videos, documents (saved to *Downloads*), language, settings.

Each Quick Tunnel address is a different site, so you sign in again after the server restarted with a new address. A permanent address ([named tunnel](#get-a-permanent-url)) avoids it.

**New version**: push a tag such as `android-v0.2.0`; GitHub Actions builds a signed APK and attaches it to a release. Installed apps update in place because every release is signed with the same key (repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Keep a safe copy of that key: if it's lost, people must uninstall the app before installing a newer one.

The app lives in `mobile/`: a small React Native (Expo) shell — the address screen, then a WebView showing the server's own web app, so the interface is always the server's current version and nothing has to be rebuilt when the web app changes. `npx expo prebuild` generates the native Android project at build time (it isn't committed).

Build locally with only Docker (Node, the Android SDK and Gradle are cached in Docker volumes; the APK lands in `mobile/dist/`, debug-signed unless the `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` variables point to the release key):

```bash
docker run --rm -v "$PWD/mobile:/project" -v converse-android-sdk:/sdk -v converse-android-gradle:/root/.gradle -v converse-node:/opt/node -v converse-npm:/root/.npm -e VERSION_NAME=0.1.0 eclipse-temurin:17-jdk bash /project/scripts/build-apk-in-docker.sh
```

---

## Using the app

1. Open the address (local or public) and click **Create account**.
2. Once signed in, click the **New conversation** icon (pencil, top of the sidebar):
   - **Direct**: the email of someone who already has an account;
   - **Group**: a group name + members' emails, separated by commas.
3. Messages arrive in realtime. `Enter` sends, `Shift + Enter` adds a new line. Messages sent by the same person within a few minutes are grouped under one timestamp.
4. **Voice message**: with the text box empty, tap the **microphone** 🎤, speak, then the **arrow** to send it (or the trash icon to discard). 5 minutes max; the browser asks for microphone access the first time.
   **Photos and videos**: tap the **photo** icon left of the text box and pick one or more files (gallery or camera on phones). Photos are straightened, resized (2048 px max) and stripped of their metadata, including GPS position; tap a photo to view it full screen. Videos are converted so every phone and browser can play them: the message shows "Processing video…" for a few seconds (longer for long videos), then the player appears. Limits: photos 25 MB, videos 95 MB and 5 minutes.
   **Documents** (PDF, Word, Excel, ZIP… any file): tap the **paperclip** and pick one or more files. They're sent exactly as they are (95 MB max) and the other person taps the card to download them. To send a photo in original quality, send it as a document.
5. A blue badge shows unread messages; the dot under your name (bottom of the sidebar) shows the connection state: green online, amber connecting, red offline. In a conversation, the header shows whether the other person is online or when they were last seen, and when they're typing.
6. **Search**: type in the box at the top of the sidebar, or press `Ctrl + K` (`⌘ K` on Mac) from anywhere, to filter conversations by name or email.
7. **Settings** (gear icon at the top of the sidebar, or tap your name at the bottom): change your display name and the interface language (**English** / **Français**). The language is saved on your account, so it follows you on every device; before signing in, the sign-in pages use the last language chosen on that device.

Good to know:
- people must **sign up first** before you can start a conversation with them;
- opening a direct conversation that already exists reopens it instead of creating a second one;
- a message that failed to send gets a red outline and a **Not sent — tap to retry** link: tap it to resend (voice notes included, as long as the page hasn't been reloaded);
- the microphone only works over **HTTPS** (tunnel address) or on `localhost`, not through a local `http://192.168…` address.

---

## Day-to-day operations

| Action | Command |
| --- | --- |
| Start (with Quick Tunnel) and print the address | `.\start.ps1` (Windows) or `./start.sh` |
| Show the public address again | `docker compose logs app \| grep trycloudflare.com` |
| Service status | `docker compose ps` |
| Server logs | `docker compose logs -f app` |
| Stop (data is kept) | `docker compose --profile quick-tunnel down` |
| Cut public access only | `docker compose stop quick-tunnel` |
| Update after a `git pull` | `docker compose --profile quick-tunnel up -d --build` |

### Keep the PC available

The chat is only reachable while your PC is **on and awake**:

- Windows: *Settings → System → Power → Sleep* → **Never** (at least when plugged in).
- Docker Desktop: *Settings → General* → **Start Docker Desktop when you sign in**. Containers restart on their own (`restart: unless-stopped`), but the Quick Tunnel address changes.

### Delete test accounts

```bash
docker compose exec db psql -U converse -d converse -c "delete from users where email like '%@test.local' or email like '%@t.l';"
```

Their sessions, memberships and messages are deleted along with them.

---

## Backups and restore

The `backup` service writes to `./backups` **on startup and then every 24 h**, and keeps the **last 7** of each (configurable with `BACKUP_KEEP` and `BACKUP_INTERVAL` in `.env`):

- `converse-YYYYMMDD-HHMMSS.dump`: the database (accounts, conversations, messages);
- `converse-uploads-YYYYMMDD-HHMMSS.tar.gz`: the audio files of voice messages.

The database and audio files live in **Docker volumes** (`pgdata` and `uploads`), not in a project folder: use these backups to keep them safe or move them. You need **both files from the same backup** to restore voice notes, photos, videos and documents that open.

> The uploads archive contains every photo and video, so it grows with them, times `BACKUP_KEEP` copies. Watch the size of `backups/` if people send many videos, and lower `BACKUP_KEEP` if needed.

Force an immediate backup:

```bash
docker compose restart backup
```

To keep your backups safe, sync the `backups/` folder with OneDrive or Google Drive: it's the only folder to copy elsewhere.

### Older installs: database in `data/postgres`

Early versions stored the database in the `data/postgres` folder. On Windows and macOS, Docker Desktop shares that folder slowly and unreliably for a database (repeated crashes and recoveries), so the database now lives in the `pgdata` volume. To migrate **without data loss**:

```bash
docker compose stop app backup
docker compose exec -T db pg_dump -U converse -Fc -f /tmp/migration.dump converse
docker compose cp db:/tmp/migration.dump backups/migration.dump
docker compose stop db
git pull                      # gets the docker-compose.yml that uses `pgdata`
docker compose up -d db       # creates the empty database in the volume
docker compose cp backups/migration.dump db:/tmp/migration.dump
docker compose exec -T db pg_restore -U converse -d converse --no-owner /tmp/migration.dump
docker compose --profile quick-tunnel up -d --build
```

In Git Bash, prefix the commands containing `/tmp/…` with `MSYS_NO_PATHCONV=1`. Check that everything is there (sign-in, conversations, voice notes) before deleting the old `data/postgres` folder, which the new configuration no longer uses.

### Restore a backup

```bash
docker compose stop app
docker compose exec -T db pg_restore -U converse -d converse --clean --if-exists < backups/converse-YYYYMMDD-HHMMSS.dump
docker compose run --rm --no-deps -v ./backups:/backups:ro app tar -xzf /backups/converse-uploads-YYYYMMDD-HHMMSS.tar.gz -C /app/data/uploads
docker compose start app
```

### Move to another machine

1. On the new machine: `git clone`, then copy your `.env` and the latest backup from `backups/` (the `.dump` **and** its matching `.tar.gz`).
2. `docker compose up -d`, then restore the backup (commands above).
3. With a named tunnel the public address stays the same; with Quick Tunnel a new address is generated.

---

## Development

```bash
npm install
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db
```

Set a `DATABASE_URL` in `.env` that points to `localhost:5432` with your `DB_PASSWORD` (see `.env.example`), then:

```bash
npm run dev
```

The dev app runs on http://localhost:3000: stop the `app` container first (`docker compose stop app`) to free the port, or run `npm run dev -- --port 3001`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server (Vite + Nitro, hot reload) |
| `npm run build` | Production build into `.output/` |
| `npm run lint` / `npm run format` / `npm run check` | ESLint and Prettier |
| `npm run generate-routes` | Regenerates `src/routeTree.gen.ts` |
| `npm run db:generate` | Creates a migration after editing `server/db/schema.ts` |
| `npm run db:studio` | Drizzle Studio database browser |
| `npm run test` | Unit tests (Vitest, `src/**/*.test.ts`) |
| `npm run test:e2e` | Server integration tests (REST + WebSocket) against the build and a real Postgres |

Migrations are applied automatically when the server starts.

### Integration tests

`tests/e2e/` starts the built server (`node .output/server/index.mjs`) on port 3123 and tests it against a **dedicated** Postgres database: the tests create accounts and rooms there, so never point them at the real database.

```bash
docker run -d --name converse-e2e-db -p 127.0.0.1:55432:5432 -e POSTGRES_USER=converse -e POSTGRES_PASSWORD=converse -e POSTGRES_DB=converse_test postgres:17
```

```bash
npm run build
```

```bash
npm run test:e2e
```

Optional variables: `E2E_DATABASE_URL` (default `postgres://converse:converse@127.0.0.1:55432/converse_test`), `E2E_PORT` (default `3123`) and `E2E_SERVER_LOG=1` to print the server logs. Remember to re-run `npm run build` after changing `server/`. Voice tests are skipped when `ffmpeg` isn't installed locally; CI installs it.

GitHub Actions CI (`.github/workflows/ci.yml`) runs on every PR and push to `main`: type check, ESLint, unit tests, build, then these tests with a `postgres:17` service.

### Code layout

```
server/          # Nitro backend
  api/           # REST → /api/*
  routes/ws.ts   # WebSocket → /ws
  db/            # Drizzle schema, client, migrations
  utils/         # auth, realtime hub, rooms, messages, voice
src/             # web client — Feature-Sliced Design
  app/ pages/ widgets/ features/ entities/ shared/
  routes/        # TanStack routes (thin, delegate to pages)
tests/e2e/       # server integration tests (Vitest)
```

---

## Troubleshooting

**`failed to fetch oauth token … auth.docker.io … getaddrinfow`** during `docker compose up`
Docker Desktop can't resolve Docker Hub (DNS). Retry a few times; if it persists, set your Windows network DNS to `1.1.1.1` or `8.8.8.8`.

**`listen EACCES: permission denied` on a port**
Windows reserves some port ranges (Hyper-V). Pick another port.

**The app stays offline / reconnecting**
The WebSocket is down; it reconnects on its own (and immediately when you come back to the tab). Messages sent meanwhile go through HTTP. If it lasts: `docker compose ps` and `docker compose logs app`.

**The trycloudflare address stopped working**
The tunnel restarted and the address changed: get the new one with `docker compose logs quick-tunnel | grep trycloudflare.com`.

**`tar (child): Cannot connect to C: resolve failed` when restoring voice notes**
Git Bash rewrites `/backups/…` paths into Windows paths. Run the command from PowerShell, or prefix it with `MSYS_NO_PATHCONV=1`.

**The microphone button doesn't show up**
Browsers only allow the microphone over HTTPS or on `localhost`. Use the tunnel address (`https://…`) rather than a local `http://` address.

**"Microphone access denied"**
Allow the microphone for this site in the browser settings (padlock icon in the address bar), then try again.

**"Voice messages are not available on this server"**
ffmpeg is missing: that's the case with `npm run dev` without ffmpeg installed on the machine. The Docker image includes it.

**Redirected to the sign-in page**
The session expired (30 days) or you signed out elsewhere: sign in again.

---

## Known limitations

- **PC off = chat offline.** For 24/7 availability, the same stack runs as-is on a small VPS or a Raspberry Pi.
- **No push notifications**: messages are only visible with the app open (by design for the web app and the upcoming Android app).
- **No password reset** and no Google sign-in.
- **Single server**: realtime fan-out is in memory, which suits friends or a small team.
- **Video conversion uses your PC's CPU**: one video at a time; a long video can take a while to show up. A video being converted when the server restarts is marked as failed and must be sent again.
- **Upload size**: Cloudflare's free tunnel refuses uploads over 100 MB, hence the 95 MB video limit.

---

## License

[MIT](LICENSE) © 2026 Dioman Keïta

The interface uses the Geist and Geist Mono fonts (Vercel), under the SIL Open Font License,
bundled through Fontsource. Icons are from Lucide (ISC License).
