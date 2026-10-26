import { currentLocale, translate } from "@/shared/i18n"

import { ApiError } from "./http"

/**
 * POSTs a file as the raw request body, reporting progress (0–1).
 * Uses XMLHttpRequest because fetch can't observe upload progress.
 */
export function uploadFile<T>(
  path: string,
  file: Blob,
  onProgress?: (fraction: number) => void,
  headers: Record<string, string> = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", path)
    xhr.withCredentials = true
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream")
    xhr.setRequestHeader("accept-language", currentLocale())
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value)
    xhr.responseType = "json"

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    xhr.onload = () => {
      const data: unknown = xhr.response
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data as T)
      const message =
        data && typeof data === "object" && "message" in data && typeof data.message === "string"
          ? data.message
          : translate(currentLocale(), "http.failed", { status: xhr.status })
      reject(new ApiError(xhr.status, message))
    }
    xhr.onerror = () => reject(new ApiError(0, translate(currentLocale(), "http.failed", { status: 0 })))
    xhr.send(file)
  })
}
