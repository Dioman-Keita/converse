import { randomUUID } from "node:crypto"
import postgres from "postgres"
import { inject } from "vitest"

export const baseUrl = inject("baseUrl")
export const wsUrl = baseUrl.replace(/^http/, "ws") + "/ws"

/** Direct database access, for setups the API can't express (e.g. exact timestamps). */
export const sql = postgres(inject("databaseUrl"), { max: 2, onnotice: () => {} })

export type User = { id: string; name: string; email: string }
export type Account = { user: User; token: string; email: string; password: string }

export function uniqueEmail(prefix = "user") {
  return `${prefix}-${randomUUID()}@e2e.test`
}

export async function api(
  path: string,
  {
    method = "GET",
    body,
    token,
    headers = {},
  }: { method?: string; body?: unknown; token?: string; headers?: Record<string, string> } = {},
) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { "content-type": "application/json" } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json: any
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    json = undefined
  }
  return { status: res.status, headers: res.headers, json }
}

export async function register(prefix = "user"): Promise<Account> {
  const email = uniqueEmail(prefix)
  const password = "correct-horse-battery"
  const res = await api("/api/auth/register", {
    method: "POST",
    body: { name: prefix, email, password },
  })
  if (res.status !== 200) throw new Error(`register failed: ${res.status}`)
  return { user: res.json.user, token: res.json.token, email, password }
}

export async function createDirectRoom(owner: Account, other: Account) {
  const res = await api("/api/rooms", {
    method: "POST",
    token: owner.token,
    body: { type: "direct", memberEmails: [other.email] },
  })
  if (res.status !== 200) throw new Error(`create room failed: ${res.status}`)
  return res.json.room as { id: string }
}

// Node 24's global WebSocket (undici) accepts `{ headers }` as its 2nd argument;
// the DOM typings only know about `protocols`.
const NodeWebSocket = WebSocket as unknown as new (
  url: string,
  init?: { headers?: Record<string, string> },
) => WebSocket

export type ServerEvent = { type: string; [key: string]: any }

export type Client = {
  send: (event: unknown) => void
  sendRaw: (data: string) => void
  /** Resolves with the next received event matching `match` (already-received ones included). */
  next: (match: (event: ServerEvent) => boolean, timeoutMs?: number) => Promise<ServerEvent>
  close: () => void
}

/** Opens a socket and waits for the handshake; rejects if the server refuses it. */
export function connect(headers: Record<string, string>): Promise<Client> {
  const ws = new NodeWebSocket(wsUrl, { headers })
  const received: ServerEvent[] = []
  const waiters = new Set<{ match: (e: ServerEvent) => boolean; resolve: (e: ServerEvent) => void }>()

  ws.addEventListener("message", (msg) => {
    const event = JSON.parse(String(msg.data)) as ServerEvent
    for (const waiter of waiters) {
      if (waiter.match(event)) {
        waiters.delete(waiter)
        waiter.resolve(event)
        return
      }
    }
    received.push(event)
  })

  const take = (match: (e: ServerEvent) => boolean) => {
    const index = received.findIndex(match)
    return index === -1 ? undefined : received.splice(index, 1)[0]
  }

  const client: Client = {
    send: (event) => ws.send(JSON.stringify(event)),
    sendRaw: (data) => ws.send(data),
    next: (match, timeoutMs = 5_000) => {
      const already = take(match)
      if (already) return Promise.resolve(already)
      return new Promise((resolve, reject) => {
        const waiter = {
          match,
          resolve: (e: ServerEvent) => {
            clearTimeout(timer)
            resolve(e)
          },
        }
        const timer = setTimeout(() => {
          waiters.delete(waiter)
          reject(new Error(`timed out waiting for event; got ${JSON.stringify(received)}`))
        }, timeoutMs)
        waiters.add(waiter)
      })
    },
    close: () => ws.close(),
  }

  return new Promise((resolve, reject) => {
    ws.addEventListener("open", () => resolve(client))
    ws.addEventListener("error", () => reject(new Error("WebSocket handshake refused")))
  })
}

export function bearer(account: Account) {
  return { authorization: `Bearer ${account.token}` }
}

export const isType = (type: string) => (event: ServerEvent) => event.type === type
