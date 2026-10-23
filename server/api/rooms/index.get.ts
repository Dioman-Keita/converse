import { defineHandler } from "nitro/h3"

import { requireUser } from "../../utils/http"
import { listRooms } from "../../utils/rooms"

/** Rooms the current user belongs to, most recently active first. */
export default defineHandler(async (event) => {
  const user = await requireUser(event)
  return { rooms: await listRooms(user.id) }
})
