import { useState } from "react"
import type { FormEvent } from "react"

import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { Button, Card, Input, Label, StickerChoice } from "@/shared/ui"

import { createRoom } from "../api/create-room"

type CreateRoomFormProps = {
  onCreated: (room: Room) => void
  onCancel: () => void
}

/** Start a direct conversation by email, or a group with several emails — a scrap taped in the index. */
export function CreateRoomForm({ onCreated, onCancel }: CreateRoomFormProps) {
  const { t } = useI18n()
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
      setError(err instanceof Error ? err.message : t("room.createFailed"))
      setPending(false)
    }
  }

  return (
    <Card tilt={-1} size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-(--card-spacing)">
        <StickerChoice
          name="room-type"
          label={t("chat.newConversation")}
          options={[
            { value: "direct", label: t("room.direct") },
            { value: "group", label: t("room.group") },
          ]}
          value={type}
          onChange={setType}
        />

        {type === "group" && (
          <div className="grid gap-1">
            <Label htmlFor="room-name">{t("room.groupName")}</Label>
            <Input id="room-name" name="name" placeholder={t("room.groupNamePlaceholder")} required />
          </div>
        )}

        <div className="grid gap-1">
          <Label htmlFor="room-emails">
            {type === "direct" ? t("room.theirEmail") : t("room.membersEmails")}
          </Label>
          <Input
            id="room-emails"
            name="emails"
            type={type === "direct" ? "email" : "text"}
            placeholder={
              type === "direct" ? t("room.directEmailPlaceholder") : t("room.groupEmailsPlaceholder")
            }
            autoComplete="off"
            required={type === "direct"}
          />
        </div>

        {error && (
          <p role="alert" className="m-0 text-base text-error-ink">
            ✗ {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button type="submit" size="sm" className="flex-1" disabled={pending}>
            {pending ? t("room.starting") : `${t("room.start")} →`}
          </Button>
          <Button type="button" size="sm" variant="link" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </Card>
  )
}
