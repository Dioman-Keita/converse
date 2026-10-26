import { definePlugin } from "nitro"

/**
 * Logs the public Quick Tunnel address, prominently, whenever it's assigned or
 * changes (every tunnel restart gets a new random trycloudflare.com address).
 * cloudflared's metrics server reports it at /quicktunnel; see docker-compose.yml.
 * Without the quick-tunnel profile the metrics host doesn't exist: nothing is logged.
 */
export default definePlugin(() => {
  const metrics = process.env.QUICK_TUNNEL_METRICS_URL
  if (!metrics) return

  let current: string | undefined
  let timer: ReturnType<typeof setTimeout> | undefined

  const check = async () => {
    try {
      const res = await fetch(`${metrics}/quicktunnel`, { signal: AbortSignal.timeout(3_000) })
      const { hostname } = (await res.json()) as { hostname?: string }
      if (hostname && hostname !== current) {
        current = hostname
        logBanner(`https://${hostname}`)
      }
    } catch {
      // Tunnel not up yet (or not enabled): try again later.
    }
    // Poll quickly until the first address, then just watch for changes.
    timer = setTimeout(check, current ? 30_000 : 2_000)
    timer.unref()
  }
  void check()
})

function logBanner(url: string) {
  const line = "═".repeat(url.length + 6)
  console.info(
    [
      "",
      `╔${line}╗`,
      `║   ${" ".repeat(url.length)}   ║`,
      `║   ${url}   ║`,
      `║   ${" ".repeat(url.length)}   ║`,
      `╚${line}╝`,
      "[converse] Public URL (Quick Tunnel) — share it, or paste it into the Android app.",
      "",
    ].join("\n"),
  )
}
