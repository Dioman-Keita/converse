import { defineHandler } from "nitro/h3"

import { requireUser } from "../../utils/http"

export default defineHandler(async (event) => {
  return { user: await requireUser(event) }
})
