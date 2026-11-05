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
import { Tape } from "@/shared/ui"

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

type FileAttachmentProps = {
  message: ChatMessage
  /** Own documents are washed in pink, the others' in pale blue. */
  mine: boolean
}

/** Document as an index card taped on the page: icon, name, size and a download link (or upload progress). */
export function FileAttachment({ message, mine }: FileAttachmentProps) {
  const { t, intlLocale } = useI18n()
  const file = message.file
  if (!file) return null
  const Icon = fileIcon(file.name, file.mime)
  const progress = message.upload?.progress
  const percent = progress === undefined ? undefined : Math.round(progress * 100)
  const size = formatBytes(file.size, intlLocale, t)

  const content = (
    <>
      <Tape placement="top-right" angle={28} className="h-4 w-12" />
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-hand)] border-2 border-ink/80 bg-paper-light">
        <Icon className="rough size-5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-title text-lg leading-tight" title={file.name}>
          {file.name}
        </span>
        {percent === undefined ? (
          <span className="text-xs text-ink-soft">{size}</span>
        ) : (
          <span className="mt-1 flex items-center gap-2">
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={t("file.uploading", { percent })}
            >
              <span
                className={cn("block h-full rounded-full transition-[width] duration-200", mine ? "bg-pink" : "bg-blue")}
                style={{ width: `${percent}%` }}
              />
            </span>
            <span className="text-xs tabular-nums">{percent}%</span>
          </span>
        )}
      </span>
      {percent === undefined && <Download className="rough size-4 shrink-0 opacity-70" aria-hidden />}
    </>
  )

  const className = cn(
    "note flex w-64 max-w-full items-center gap-3 px-3 py-2.5 text-left",
    mine ? "note-mine" : "note-theirs",
  )

  // Still uploading (or failed before reaching the server): nothing to download yet.
  if (percent !== undefined || !file.url) return <div className={className}>{content}</div>
  return (
    <a
      href={file.url}
      download={file.name}
      className={cn(className, "transition-[rotate,translate] duration-200 hover:-translate-y-0.5 hover:-rotate-1")}
      aria-label={t("file.download", { name: file.name })}
    >
      {content}
    </a>
  )
}
