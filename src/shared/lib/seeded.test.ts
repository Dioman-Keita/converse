import { describe, expect, it } from "vitest"

import { gradientFor, hashString, pick, seeded } from "./seeded"

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

describe("gradientFor", () => {
  it("is stable for the same seed", () => {
    expect(gradientFor("user-42")).toBe(gradientFor("user-42"))
  })

  it("gives different people different gradients", () => {
    expect(gradientFor("user-1")).not.toBe(gradientFor("user-2"))
  })

  it("is a CSS gradient of two oklch colors", () => {
    expect(gradientFor("x")).toMatch(/^linear-gradient\(135deg, oklch\([^)]+\), oklch\([^)]+\)\)$/)
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
