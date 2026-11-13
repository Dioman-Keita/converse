import { CircleAlert } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { FormEvent } from "react"

import type { Room } from "@/entities/room"
import { useI18n } from "@/shared/i18n"
import { transitions } from "@/shared/lib/motion"
import { Button, Input, Label, Segmented, Spinner } from "@/shared/ui"

import { createRoom } from "../api/create-room"

type CreateRoomFormProps = {
  onCreated: (room: Room) => void
  onCancel: () => void
}

/** Start a direct conversation by email, or a group with several emails. */
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
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-hairline-strong bg-gray-100 p-3 shadow-md"
    >
      <p className="m-0 text-[13px] font-semibold text-gray-900">{t("chat.newConversation")}</p>
      <Segmented
        name="room-type"
        label={t("chat.newConversation")}
        options={[
          { value: "direct", label: t("room.direct") },
          { value: "group", label: t("room.group") },
        ]}
        value={type}
        onChange={setType}
      />

      <AnimatePresence initial={false}>
        {type === "group" && (
          <motion.div
            key="group-name"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitions.base}
          >
            <div className="grid gap-1.5 pb-0.5">
              <Label htmlFor="room-name">{t("room.groupName")}</Label>
              <Input id="room-name" name="name" className="h-9" placeholder={t("room.groupNamePlaceholder")} required />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-1.5">
        <Label htmlFor="room-emails">{type === "direct" ? t("room.theirEmail") : t("room.membersEmails")}</Label>
        <Input
          id="room-emails"
          name="emails"
          className="h-9"
          type={type === "direct" ? "email" : "text"}
          placeholder={type === "direct" ? t("room.directEmailPlaceholder") : t("room.groupEmailsPlaceholder")}
          autoComplete="off"
          autoFocus
          required={type === "direct"}
        />
      </div>

      {error && (
        <p role="alert" className="m-0 flex items-start gap-2 text-[13px] text-red">
          <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending && <Spinner className="size-3.5" />}
          {pending ? t("room.starting") : t("room.start")}
        </Button>
      </div>
    </form>
  )
}
