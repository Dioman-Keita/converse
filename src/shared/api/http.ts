/** Error thrown for non-2xx API responses, carrying the server's message. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

type ApiOptions = {
  method?: "GET" | "POST"
  json?: unknown
}

/** Same-origin JSON request; the session cookie is sent automatically. */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const hasBody = options.json !== undefined
  const res = await fetch(path, {
    method: options.method ?? (hasBody ? "POST" : "GET"),
    headers: hasBody ? { "content-type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options.json) : undefined,
    credentials: "same-origin",
  })

  const data: unknown = await res.json().catch(() => undefined)
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : `La requête a échoué (${res.status})`
    throw new ApiError(res.status, message)
  }
  return data as T
}
