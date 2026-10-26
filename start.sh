#!/usr/bin/env sh
# Starts Converse with a Quick Tunnel and prints its public address.
#   ./start.sh            start (or restart) the stack
#   ./start.sh --build    rebuild the app image first (after a git pull)
set -e
cd "$(dirname "$0")"

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start it, then run this script again." >&2
  exit 1
fi
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example: set DB_PASSWORD in it, then run this script again." >&2
  exit 1
fi

if [ "$1" = "--build" ]; then
  docker compose --profile quick-tunnel up -d --build
else
  docker compose --profile quick-tunnel up -d
fi

echo "Waiting for the public address..."
url=""
i=0
while [ -z "$url" ] && [ "$i" -lt 60 ]; do
  # Ask cloudflared (through the app container) for the current address.
  host=$(docker compose exec -T app node -e "fetch('http://quick-tunnel:20241/quicktunnel').then(r=>r.json()).then(j=>console.log(j.hostname||'')).catch(()=>{})" 2>/dev/null || true)
  if [ -n "$host" ]; then url="https://$host"; else i=$((i + 1)); sleep 2; fi
done

if [ -z "$url" ]; then
  echo "The tunnel didn't report an address yet. Check: docker compose logs quick-tunnel" >&2
  exit 1
fi

line=$(printf '%*s' $((${#url} + 6)) '' | tr ' ' '=')
printf '\n  %s\n     %s\n  %s\n\n' "$line" "$url" "$line"
echo "  Converse is online. Share this address, or paste it into the Android app."
echo "  Local: http://localhost:3000   Logs: docker compose logs -f app"
echo
