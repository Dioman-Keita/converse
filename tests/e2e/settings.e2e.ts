import { describe, expect, it } from "vitest"

import { api, createDirectRoom, register, uniqueEmail } from "./helpers"

describe("profile settings", () => {
  it("defaults new accounts to English", async () => {
    const alice = await register("alice")
    const me = await api("/api/auth/me", { token: alice.token })
    expect(me.json.user.locale).toBe("en")
  })

  it("keeps the language the account was created in", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Awa", email: uniqueEmail("awa"), password: "correct-horse-battery", locale: "fr" },
    })
    expect(res.status).toBe(200)
    expect(res.json.user.locale).toBe("fr")
  })

  it("ignores an unsupported sign-up language", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "X", email: uniqueEmail("x"), password: "correct-horse-battery", locale: "de" },
    })
    expect(res.json.user.locale).toBe("en")
  })

  it("updates the language and display name", async () => {
    const alice = await register("alice")
    const bob = await register("bob")
    await createDirectRoom(alice, bob)

    const res = await api("/api/auth/me", {
      method: "PATCH",
      token: alice.token,
      body: { locale: "fr", name: "  Alice Diallo  " },
    })
    expect(res.status).toBe(200)
    expect(res.json.user).toMatchObject({ locale: "fr", name: "Alice Diallo" })

    // Persisted, and visible to people who share a room with her.
    expect((await api("/api/auth/me", { token: alice.token })).json.user.locale).toBe("fr")
    const rooms = await api("/api/rooms", { token: bob.token })
    const member = rooms.json.rooms[0].members.find((m: { id: string }) => m.id === alice.user.id)
    expect(member.name).toBe("Alice Diallo")
  })

  it("changes only the fields that are sent", async () => {
    const alice = await register("alice")
    await api("/api/auth/me", { method: "PATCH", token: alice.token, body: { locale: "fr" } })
    const res = await api("/api/auth/me", {
      method: "PATCH",
      token: alice.token,
      body: { name: "Renamed" },
    })
    expect(res.json.user).toMatchObject({ name: "Renamed", locale: "fr" })
  })

  it("rejects invalid settings and anonymous updates", async () => {
    const alice = await register("alice")
    const badLocale = await api("/api/auth/me", { method: "PATCH", token: alice.token, body: { locale: "de" } })
    expect(badLocale.status).toBe(400)
    const emptyName = await api("/api/auth/me", { method: "PATCH", token: alice.token, body: { name: "   " } })
    expect(emptyName.status).toBe(400)
    expect((await api("/api/auth/me", { method: "PATCH", body: { locale: "fr" } })).status).toBe(401)
  })
})

describe("localized server messages", () => {
  const wrongLogin = (language?: string) =>
    api("/api/auth/login", {
      method: "POST",
      body: { email: uniqueEmail("nobody"), password: "wrong-password" },
      headers: language ? { "accept-language": language } : {},
    })

  it("answers in English by default", async () => {
    expect((await wrongLogin()).json.message).toBe("Invalid email or password")
    expect((await wrongLogin("de-DE,de;q=0.9")).json.message).toBe("Invalid email or password")
  })

  it("answers in French when the app asks for it", async () => {
    expect((await wrongLogin("fr")).json.message).toBe("Email ou mot de passe incorrect")
    expect((await wrongLogin("fr-FR,fr;q=0.9,en;q=0.8")).json.message).toBe(
      "Email ou mot de passe incorrect",
    )
  })

  it("translates field validation messages", async () => {
    const body = { name: "A", email: uniqueEmail("a"), password: "short" }
    const en = await api("/api/auth/register", { method: "POST", body })
    const fr = await api("/api/auth/register", { method: "POST", body, headers: { "accept-language": "fr" } })
    expect(en.json.message).toBe("Password must be between 8 and 200 characters")
    expect(fr.json.message).toBe("Le mot de passe doit contenir entre 8 et 200 caractères")
  })
})
