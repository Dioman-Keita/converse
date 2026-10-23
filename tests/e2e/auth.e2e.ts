import { describe, expect, it } from "vitest"

import { api, register, uniqueEmail } from "./helpers"

describe("auth", () => {
  it("registers, sets an httpOnly session cookie and returns a token", async () => {
    const email = uniqueEmail("register")
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Alice", email, password: "long-enough" },
    })
    expect(res.status).toBe(200)
    expect(res.json.token).toEqual(expect.any(String))
    expect(res.json.user).toMatchObject({ name: "Alice", email })
    expect(res.json.user).not.toHaveProperty("passwordHash")

    const cookie = res.headers.get("set-cookie") ?? ""
    expect(cookie).toMatch(/converse_session=/)
    expect(cookie).toMatch(/HttpOnly/i)
  })

  it("rejects a duplicate email with 409", async () => {
    const account = await register("dup")
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Other", email: account.email, password: "long-enough" },
    })
    expect(res.status).toBe(409)
  })

  it("rejects a password shorter than 8 characters with 400", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Short", email: uniqueEmail("short"), password: "1234567" },
    })
    expect(res.status).toBe(400)
  })

  it("rejects a wrong password with 401", async () => {
    const account = await register("wrongpw")
    const res = await api("/api/auth/login", {
      method: "POST",
      body: { email: account.email, password: "not-the-password" },
    })
    expect(res.status).toBe(401)
  })

  it("logs in with a differently-cased email and never returns passwordHash", async () => {
    const account = await register("case")
    const res = await api("/api/auth/login", {
      method: "POST",
      body: { email: account.email.toUpperCase(), password: account.password },
    })
    expect(res.status).toBe(200)
    expect(res.json.user.id).toBe(account.user.id)
    expect(res.json.user).not.toHaveProperty("passwordHash")
    expect(res.json.token).toEqual(expect.any(String))
  })

  it("returns the current user for a Bearer token", async () => {
    const account = await register("me")
    const res = await api("/api/auth/me", { token: account.token })
    expect(res.status).toBe(200)
    expect(res.json.user).toMatchObject({ id: account.user.id, email: account.email })
    expect(res.json.user).not.toHaveProperty("passwordHash")
  })

  it("returns 401 without authentication", async () => {
    expect((await api("/api/auth/me")).status).toBe(401)
    expect((await api("/api/rooms")).status).toBe(401)
  })

  it("invalidates the token on logout", async () => {
    const account = await register("logout")
    const res = await api("/api/auth/logout", { method: "POST", token: account.token })
    expect(res.status).toBe(200)
    expect((await api("/api/auth/me", { token: account.token })).status).toBe(401)
  })

  it("accepts exactly one of several concurrent sign-ups with the same email", async () => {
    const email = uniqueEmail("race")
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        api("/api/auth/register", {
          method: "POST",
          body: { name: `Racer ${i}`, email, password: "long-enough" },
        }),
      ),
    )
    const statuses = results.map((r) => r.status).sort()
    expect(statuses).toEqual([200, 409, 409, 409, 409])
  })
})
