# Self-hosting guide

Everything you need to run Converse for real: making it public, keeping it available, backing it up and fixing
common problems. To get it running the first time, see [Quick start](../README.md#quick-start).

## Contents

1. [Public access](#public-access)
2. [Permanent address](#permanent-address)
3. [Day-to-day operations](#day-to-day-operations)
4. [Backups and restore](#backups-and-restore)
5. [Troubleshooting](#troubleshooting)

---

## Public access

### Quick Tunnel (no account, no domain)

The start scripts (`./start.sh`, `.\start.ps1`) start the stack with the `quick-tunnel` profile, wait for the
tunnel and print its address, for example `https://random-words.trycloudflare.com`. It works over HTTPS, on
mobile data as well as Wi-Fi, with nothing to configure on your router. The server also prints the address in
its logs every time it changes (`docker compose logs app`).

> [!WARNING]
> **The address changes every time the tunnel restarts** (machine or Docker restart, `docker compose down`).
> You then have to share the new one, and people sign in again because it's a new site.
> For an address that never changes, use a [permanent address](#permanent-address).

## Permanent address

Something on the Internet has to own a stable address. The options, from most to least recommended:

### 1. Your domain + a named Cloudflare tunnel (recommended)

**Cost:** about €10 a year for the domain; the tunnel is free (Cloudflare Free plan). You get an address like
`https://chat.yourdomain.com`.

1. Buy a domain (Cloudflare Registrar sells them at cost) or add one you already own to Cloudflare (**Free** plan).
2. In the Cloudflare dashboard: **Zero Trust → Networks → Tunnels → Create a tunnel** → **Cloudflared**.
3. Name it (`converse`) and copy the **token** (the long string after `--token`).
4. In the **Public Hostname** tab: subdomain `chat`, domain `yourdomain.com`, service `HTTP` → `app:3000`.
5. Paste the token into `.env`:
   ```
   TUNNEL_TOKEN=eyJhIjoi...
   ```
6. Switch from the `quick-tunnel` profile to the `tunnel` profile:
   ```bash
   docker compose --profile quick-tunnel down
   docker compose --profile tunnel up -d
   ```

The address stays the same forever, even if you move to another machine.

### 2. Tailscale Funnel (free, no domain, not integrated yet)

Tailscale gives a free permanent address like `https://my-pc.tailnet-name.ts.net`. It's the best free option
without a domain, but it isn't wired into `docker-compose.yml` yet and WebSocket support through Funnel still
needs checking. The `ts.net` name can't be customized.

### 3. ngrok static domain (not recommended)

ngrok's free static domain shows an ngrok warning page to every visitor before they reach the app, which is
fine for an API but not for people opening a link in their browser.

---

## Day-to-day operations

| Action                                        | Command                                             |
| --------------------------------------------- | --------------------------------------------------- |
| Start with Quick Tunnel and print the address | `./start.sh` or `.\start.ps1`                       |
| Update after a `git pull`                     | `./start.sh --build` or `.\start.ps1 -Build`        |
| Show the public address again                 | `docker compose logs app \| grep trycloudflare.com` |
| Service status                                | `docker compose ps`                                 |
| Server logs                                   | `docker compose logs -f app`                        |
| Cut public access only                        | `docker compose stop quick-tunnel`                  |
| Stop everything (data is kept)                | `docker compose --profile quick-tunnel down`        |

### Keep the machine available

The chat is only reachable while the host is **on and awake**:

- Windows: _Settings → System → Power → Sleep_ → **Never** (at least when plugged in).
- Docker Desktop: _Settings → General_ → **Start Docker Desktop when you sign in**. Containers restart on their
  own (`restart: unless-stopped`), but a Quick Tunnel address changes.

### Remove test accounts

```bash
docker compose exec db psql -U converse -d converse -c "delete from users where email like '%@test.local';"
```

Their sessions, memberships and messages are deleted with them.

---

## Backups and restore

The `backup` service writes to `./backups` **on startup and then every 24 hours**, and keeps the **last 7** of each
kind (`BACKUP_KEEP` and `BACKUP_INTERVAL` in `.env`):

- `converse-YYYYMMDD-HHMMSS.dump`: the database (accounts, conversations, messages);
- `converse-uploads-YYYYMMDD-HHMMSS.tar.gz`: uploaded files (voice notes, photos, videos, documents).

The database and the files live in Docker volumes (`pgdata` and `uploads`), not in the project folder. A restore
needs **both files from the same backup**. Copy the `backups/` folder somewhere else (a cloud-synced folder works
well): it's the only folder you need to keep safe.

> [!NOTE]
> The uploads archive contains every photo and video, times `BACKUP_KEEP` copies. Watch the size of `backups/`
> if people send many videos, and lower `BACKUP_KEEP` if needed.

Force a backup now:

```bash
docker compose restart backup
```

### Restore a backup

```bash
docker compose stop app
docker compose exec -T db pg_restore -U converse -d converse --clean --if-exists < backups/converse-YYYYMMDD-HHMMSS.dump
docker compose run --rm --no-deps -v ./backups:/backups:ro app tar -xzf /backups/converse-uploads-YYYYMMDD-HHMMSS.tar.gz -C /app/data/uploads
docker compose start app
```

In Git Bash, prefix commands containing `/backups/…` or `/tmp/…` with `MSYS_NO_PATHCONV=1`.

### Move to another machine

1. On the new machine: `git clone`, then copy your `.env` and the latest backup pair (`.dump` **and** `.tar.gz`).
2. `docker compose up -d`, then restore the backup as above.
3. A named tunnel keeps its address; a Quick Tunnel gets a new one.

### Upgrading an early install (`data/postgres` folder)

Early versions kept the database in the `data/postgres` folder, which Docker Desktop shares slowly and unreliably
on Windows and macOS. It now lives in the `pgdata` volume. To migrate **without data loss**:

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

Check that everything is there (sign-in, conversations, media) before deleting the old `data/postgres` folder.

---

## Troubleshooting

**`failed to fetch oauth token … auth.docker.io … getaddrinfow` during `docker compose up`**
Docker Desktop can't resolve Docker Hub (DNS). Retry; if it persists, set your network DNS to `1.1.1.1` or `8.8.8.8`.

**`listen EACCES: permission denied` on a port**
Windows reserves some port ranges (Hyper-V). Pick another port.

**The app stays offline or keeps reconnecting**
The WebSocket is down. It reconnects on its own (immediately when you come back to the tab), and text messages
sent meanwhile go through HTTP. If it lasts, check `docker compose ps` and `docker compose logs app`.

**The trycloudflare address stopped working**
The tunnel restarted and the address changed: `docker compose logs app | grep trycloudflare.com`.

**`tar (child): Cannot connect to C: resolve failed` when restoring**
Git Bash rewrites `/backups/…` paths into Windows paths. Use PowerShell, or prefix the command with `MSYS_NO_PATHCONV=1`.

**The microphone button doesn't show up**
Browsers only allow the microphone over HTTPS or on `localhost`. Use the tunnel address, not a local `http://192.168…` one.

**"Microphone access denied"**
Allow the microphone for the site in the browser settings (padlock icon in the address bar), then try again.

**"Voice messages are not available on this server"**
ffmpeg is missing. That happens with `npm run dev` on a machine without ffmpeg; the Docker image includes it.

**Redirected to the sign-in page**
The session expired (30 days), you signed out elsewhere, or the Quick Tunnel address changed. Sign in again.
