<div align="center">

# Converse

**Self-hosted realtime chat. Your machine is the server; anyone can join from a browser or an Android phone.**

[![CI](https://github.com/Dioman-Keita/converse/actions/workflows/ci.yml/badge.svg)](https://github.com/Dioman-Keita/converse/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node 24](https://img.shields.io/badge/node-24_LTS-339933?logo=nodedotjs&logoColor=white)
![Docker Compose](https://img.shields.io/badge/docker-compose-2496ED?logo=docker&logoColor=white)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Quick start](#quick-start) · [Self-hosting guide](docs/self-hosting.md) · [Architecture](ARCHITECTURE.md) · [Contributing](CONTRIBUTING.md)

</div>

---

Converse is a small, complete messaging app you run yourself with one Docker Compose command.
Your conversations, photos and voice notes stay in your own Postgres database, and a Cloudflare
Tunnel makes the app reachable over HTTPS from anywhere, **without opening a port on your router**.

## Features

- **Conversations**: direct and group chats, full history, unread badges, search (`Ctrl/⌘ K`).
- **Rich messages**: text, **voice notes**, **photos** (resized, EXIF and GPS stripped), **videos**
  (converted for every device) and **documents** of any type.
- **Realtime**: instant delivery over a single WebSocket, online status, "last seen", "is typing…",
  automatic reconnection with an HTTP fallback.
- **Clients**: responsive web app for desktop and mobile browsers, plus an [Android app](#android-app).
- **Languages**: English (default) and French, saved per account.
- **Self-hosting made simple**: one `docker compose up`, migrations on startup, daily backups of the
  database and uploaded files, public access through Cloudflare Tunnel (no account needed to start).

## How it works

```
Browser / Android app
        │ HTTPS · WSS
        ▼
Cloudflare Tunnel ◄── outbound connection from your machine (no open port)
        │
┌───────┴──────────── docker compose ─────────────┐
│ quick-tunnel / tunnel → exposes the app          │
│ app    → web app + REST API + WebSocket (Node 24)│
│ db     → Postgres 17 (never exposed)             │
│ backup → daily dumps into ./backups              │
└──────────────────────────────────────────────────┘
```

| Layer      | Technology                                                                       |
| ---------- | -------------------------------------------------------------------------------- |
| Web client | React 19, TanStack Start & Router, Tailwind CSS 4, Motion, Feature-Sliced Design |
| Server     | Nitro (Node 24), WebSocket hub in memory, REST API                               |
| Data       | PostgreSQL 17 with Drizzle ORM (migrations applied on startup)                   |
| Media      | sharp (photos), ffmpeg (voice notes, videos)                                     |
| Android    | React Native (Expo) shell around the web app                                     |
| Delivery   | Docker Compose, Cloudflare Tunnel, GitHub Actions                                |

Details on the API, the WebSocket protocol and the design decisions are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Quick start

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose) and Git.

```bash
git clone https://github.com/Dioman-Keita/converse.git
cd converse
cp .env.example .env
```

Open `.env` and set `DB_PASSWORD` to a long random value (it's only used between containers).
Then start everything and get a public address:

```bash
./start.sh          # Linux, macOS, Git Bash
```

```powershell
.\start.ps1         # Windows PowerShell
```

The first run builds the image (a few minutes). The script prints two addresses:

- **http://localhost:3000**: on this machine only;
- **`https://<random-words>.trycloudflare.com`**: the public address to share. It changes whenever the tunnel restarts.

Run the script with `--build` (`-Build` on Windows) after a `git pull` to update. For a permanent address,
backups, restores and day-to-day commands, see the **[self-hosting guide](docs/self-hosting.md)**.

## Using Converse

1. Open the address and **create an account**. People need an account before you can start a conversation with them.
2. Start a conversation with the **pencil icon** at the top of the sidebar: **Direct** (one email) or **Group** (a name and several emails).
3. Send messages: `Enter` sends, `Shift + Enter` adds a new line.
   With an empty box, the **microphone** records a voice note (up to 5 minutes).
   The **photo** and **paperclip** icons send photos and videos (25 MB / 95 MB) or any document (95 MB).
4. Change your display name and language in **Settings** (gear icon, or your name at the bottom of the sidebar).

The microphone only works over HTTPS (the tunnel address) or on `localhost`.

## Android app

Download `converse-x.y.z.apk` from the [releases](https://github.com/Dioman-Keita/converse/releases) and open it
on your phone (Android 8+; allow installing apps from your browser when asked). At every launch the app asks for
the **server address**. Paste the one printed by the start script (the last one is pre-filled). Voice notes,
photos, videos and documents work just like in the browser.

The app is a thin React Native shell (`mobile/`) that shows the server's own web app, so it never needs an update
when the web interface changes. Building and releasing it is covered in [CONTRIBUTING.md](CONTRIBUTING.md#android-app).

## Documentation

| Document                                     | Contents                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------ |
| [docs/self-hosting.md](docs/self-hosting.md) | Public access, permanent URL, operations, backups and restore, troubleshooting |
| [ARCHITECTURE.md](ARCHITECTURE.md)           | REST API, WebSocket protocol, data model, design decisions                     |
| [docs/design/](docs/design/README.md)        | Art direction, design system and motion guidelines                             |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Development setup, tests, conventions, Android builds and releases             |
| [SECURITY.md](SECURITY.md)                   | How to report a vulnerability                                                  |

## Known limitations

- **Your machine off = chat offline.** For 24/7 availability, run the same stack on a small VPS or a Raspberry Pi.
- **No push notifications**: messages show up only while the app is open.
- **No password reset** and no third-party sign-in yet.
- **Single server**: realtime fan-out happens in memory, which suits friends or a small team.
- **Video conversion runs on your CPU**, one video at a time.
- **Uploads are capped at 95 MB**, because Cloudflare's free tunnel rejects requests over 100 MB.

Ideas and pull requests that lift these limits are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

Bug reports, ideas and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for the
development setup and conventions. Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © 2026 Dioman Keïta

The interface uses the [Geist](https://vercel.com/font) and Geist Mono fonts (SIL Open Font License),
bundled through Fontsource, and [Lucide](https://lucide.dev) icons (ISC License).
