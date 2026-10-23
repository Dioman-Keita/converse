import { SendHorizontal } from "lucide-react"
import { useRef, useState } from "react"
import type { FormEvent, KeyboardEvent } from "react"

import { Button } from "@/shared/ui"

const MAX_LENGTH = 4000

type MessageComposerProps = {
  onSend: (body: string) => void
  disabled?: boolean
}

/** Enter sends, Shift+Enter adds a new line. */
export function MessageComposer({ onSend, disabled }: MessageComposerProps) {
  const [value, setValue] = useState("")
  const textarea = useRef<HTMLTextAreaElement>(null)

  function submit(event?: FormEvent) {
    event?.preventDefault()
    const body = value.trim()
    if (!body || disabled) return
    onSend(body)
    setValue("")
    textarea.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 border-t border-border/60 bg-background/80 p-3 backdrop-blur-sm"
    >
      <textarea
        ref={textarea}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_LENGTH}
        rows={1}
        placeholder="Écrire un message…"
        aria-label="Message"
        className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      />
      <Button type="submit" size="icon" disabled={disabled || !value.trim()} aria-label="Envoyer">
        <SendHorizontal />
      </Button>
    </form>
  )
}
