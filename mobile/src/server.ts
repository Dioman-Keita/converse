import AsyncStorage from "@react-native-async-storage/async-storage"

const LAST_URL_KEY = "converse.lastServerUrl"

/**
 * "abc.trycloudflare.com/chat" → "https://abc.trycloudflare.com".
 * Keeps only the origin; returns null when the text isn't a usable address.
 */
export function normalizeServerUrl(input: string): string | null {
  // The whole terminal line may have been copied: keep the first URL in it.
  const found = input.match(/https?:\/\/\S+/i)?.[0] ?? input.trim()
  if (!found) return null
  const withScheme = /^[a-z]+:\/\//i.test(found) ? found : `https://${found}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== "https:" && url.protocol !== "http:") return null
    if (!url.hostname || url.hostname.includes(" ")) return null
    return url.origin.toLowerCase()
  } catch {
    return null
  }
}

export type ServerCheck = "ok" | "unreachable" | "notConverse"

/** A Converse server answers `GET /api/auth/me` with JSON: 200 (signed in) or 401. */
export async function checkServer(origin: string, language: string): Promise<ServerCheck> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const res = await fetch(`${origin}/api/auth/me`, {
      headers: { accept: "application/json", "accept-language": language },
      signal: controller.signal,
    })
    const isJson = (res.headers.get("content-type") ?? "").includes("json")
    return (res.status === 200 || res.status === 401) && isJson ? "ok" : "notConverse"
  } catch {
    return "unreachable"
  } finally {
    clearTimeout(timer)
  }
}

export async function loadLastServerUrl(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(LAST_URL_KEY)) ?? ""
  } catch {
    return ""
  }
}

export async function saveLastServerUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_URL_KEY, url)
  } catch {
    // Not critical: the address just won't be pre-filled next time.
  }
}
