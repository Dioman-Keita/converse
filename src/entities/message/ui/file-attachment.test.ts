import { File, FileArchive, FileImage, FileSpreadsheet, FileText, Presentation } from "lucide-react"
import { describe, expect, it } from "vitest"

import { fileIcon } from "./file-attachment"

describe("fileIcon", () => {
  it("prefers the extension", () => {
    expect(fileIcon("Rapport.PDF", "application/octet-stream")).toBe(FileText)
    expect(fileIcon("budget.xlsx", "")).toBe(FileSpreadsheet)
    expect(fileIcon("slides.pptx", "")).toBe(Presentation)
    expect(fileIcon("photos.zip", "application/zip")).toBe(FileArchive)
  })

  it("falls back to the declared type, then a generic icon", () => {
    expect(fileIcon("scan", "image/png")).toBe(FileImage)
    expect(fileIcon("data.bin", "application/octet-stream")).toBe(File)
  })
})
