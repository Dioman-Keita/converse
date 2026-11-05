import { describe, expect, it } from "vitest"

import { hashString, pick, seeded, tiltFor } from "./seeded"

describe("seeded", () => {
  it("is deterministic for a seed", () => {
    const a = seeded("room-1")
    const b = seeded("room-1")
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it("differs between seeds and stays in [0, 1)", () => {
    const a = seeded("a")()
    const b = seeded("b")()
    expect(a).not.toBe(b)
    const next = seeded("range")
    for (let i = 0; i < 500; i++) {
      const value = next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

describe("tiltFor", () => {
  it("stays within the requested range", () => {
    for (let i = 0; i < 200; i++) {
      expect(Math.abs(tiltFor(`message-${i}`, 1.5))).toBeLessThanOrEqual(1.5)
    }
  })

  it("is stable for the same seed", () => {
    expect(tiltFor("msg-42")).toBe(tiltFor("msg-42"))
  })
})

describe("pick", () => {
  it("always returns the same item for a seed", () => {
    const colors = ["pink", "blue", "yellow"] as const
    expect(pick("user-7", colors)).toBe(pick("user-7", colors))
    expect(colors).toContain(pick("user-8", colors))
  })

  it("hashes to an unsigned integer", () => {
    expect(Number.isInteger(hashString("x"))).toBe(true)
    expect(hashString("x")).toBeGreaterThanOrEqual(0)
  })
})
