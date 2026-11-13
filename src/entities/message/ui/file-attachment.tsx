import {
  Download,
  File,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { useI18n } from "@/shared/i18n"
import { formatBytes } from "@/shared/lib/format-bytes"
import { cn } from "@/shared/lib/utils"

import type { ChatMessage } from "../model/types"

/** Icon from the extension first (more reliable than browsers' declared types), then the type. */
export function fileIcon(name: string, mime: string): LucideIcon {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : ""
  if (["pdf", "doc", "docx", "odt", "rtf", "txt", "md", "pages"].includes(ext)) return FileText
  if (["xls", "xlsx", "ods", "csv", "numbers"].includes(ext)) return FileSpreadsheet
  if (["ppt", "pptx", "odp", "key"].includes(ext)) return Presentation
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) return FileArchive
  if (["js", "ts", "json", "html", "css", "py", "java", "c", "cpp", "sh", "xml", "yml", "yaml"].includes(ext)) return FileCode
  if (mime.startsWith("image/")) return FileImage
  if (mime.startsWith("video/")) return FileVideo
  if (mime.startsWith("audio/")) return FileAudio
  if (mime.startsWith("text/")) return FileText
  return File
}

function extension(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toUpperCase().slice(0, 5) : ""
}

type FileAttachmentProps = {
  message: ChatMessage
  /** Own documents sit on the light surface, the others' on the dark one. */
  mine: boolean
}

/** Document card: type icon, name, extension and size, and a download action (or upload progress). */
export function FileAttachment({ message, mine }: FileAttachmentProps) {
  const { t, intlLocale } = useI18n()
  const file = message.file
  if (!file) return null
  const Icon = fileIcon(file.name, file.mime)
  const progress = message.upload?.progress
  const percent = progress === undefined ? undefined : Math.round(progress * 100)
  const size = formatBytes(file.size, intlLocale, t)
  const ext = extension(file.name)

  const content = (
    <>
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-lg",
          mine ? "bg-gray-50/[0.08] text-gray-50" : "border border-hairline-strong bg-gray-100 text-gray-900",
        )}
      >
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium" title={file.name}>
          {file.name}
        </span>
        {percent === undefined ? (
          <span className={cn("font-mono text-[11px]", mine ? "text-gray-50/60" : "text-gray-700")}>
            {ext && `${ext} · `}
            {size}
          </span>
        ) : (
          <span className="mt-1 flex items-center gap-2">
            <span
              className={cn("h-1 flex-1 overflow-hidden rounded-full", mine ? "bg-gray-50/15" : "bg-gray-900/15")}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={t("file.uploading", { percent })}
            >
              <span
                className="block h-full rounded-full bg-blue transition-[width] duration-200"
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="font-mono text-[11px] tabular-nums">{percent}%</span>
          </span>
        )}
      </span>
      {percent === undefined && (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
            mine ? "group-hover:bg-gray-50/10" : "group-hover:bg-gray-300",
          )}
        >
          <Download className="size-4 opacity-70 transition-transform duration-200 group-hover:translate-y-px" aria-hidden />
        </span>
      )}
    </>
  )

  const className = cn(
    "group flex w-72 max-w-full items-center gap-3 rounded-2xl p-2.5 pr-3 text-left",
    mine ? "bg-bubble-mine text-bubble-mine-fg" : "bg-bubble-theirs text-bubble-theirs-fg",
  )

  // Still uploading (or failed before reaching the server): nothing to download yet.
  if (percent !== undefined || !file.url) return <div className={className}>{content}</div>
  return (
    <a href={file.url} download={file.name} className={className} aria-label={t("file.download", { name: file.name })}>
      {content}
    </a>
  )
}
