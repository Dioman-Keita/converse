import { useState } from "react"
import type { FormEvent } from "react"

import type { Room } from "@/entities/room"
import { cn } from "@/shared/lib/utils"
import { Button, Input, Label } from "@/shared/ui"

import { createRoom } from "../api/create-room"

type CreateRoomFormProps = {
  onCreated: (room: Room) => void
  onCancel: () => void
}

/** Start a direct conversation by email, or a group with several emails. */
export function CreateRoomForm({ onCreated, onCancel }: CreateRoomFormProps) {
  const [type, setType] = useState<"direct" | "group">("direct")
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const emails = String(form.get("emails"))
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean)

    setError(undefined)
    setPending(true)
    try {
      const room = await createRoom(
        type === "direct"
          ? { type, memberEmails: [emails[0] ?? ""] }
          : { type, name: String(form.get("name")), memberEmails: emails },
      )
      onCreated(room)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de créer la conversation")
      setPending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card/60 p-3"
    >
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/50 p-1 text-sm">
        {(["direct", "group"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={cn(
              "rounded-md px-2 py-1 transition-colors",
              type === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {value === "direct" ? "Privée" : "Groupe"}
          </button>
        ))}
      </div>

      {type === "group" && (
        <div className="grid gap-1.5">
          <Label htmlFor="room-name">Nom du groupe</Label>
          <Input id="room-name" name="name" placeholder="Sortie du week-end" required />
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="room-emails">
          {type === "direct" ? "Son email" : "Emails des membres"}
        </Label>
        <Input
          id="room-emails"
          name="emails"
          type={type === "direct" ? "email" : "text"}
          placeholder={type === "direct" ? "ami@exemple.com" : "a@exemple.com, b@exemple.com"}
          autoComplete="off"
          required={type === "direct"}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1" disabled={pending}>
          {pending ? "Création…" : "Démarrer"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
