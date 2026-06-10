/**
 * @file src/lib/__tests__/date.test.ts
 * @description Unit test untuk menguji fungsionalitas date.
 */

import { describe, it, expect, beforeAll } from "vitest"

type DateMod = typeof import("@/lib/date")
let mod: DateMod

beforeAll(async () => {
  process.env.TZ_OFFSET = "+07:00"
  mod = await import("@/lib/date")
})

describe("date utilities", () => {
  describe("tahunRange", () => {
    it("returns correct date range for a given year", () => {
      const range = mod.tahunRange(2024)
      expect(range.gte.getFullYear()).toBe(2024)
      expect(range.gte.getMonth()).toBe(0)
      expect(range.gte.getDate()).toBe(1)
      expect(range.lte.getFullYear()).toBe(2024)
      expect(range.lte.getMonth()).toBe(11)
      expect(range.lte.getDate()).toBe(31)
    })
  })

  describe("tahunMulai", () => {
    it("returns Jan 1 of the given year", () => {
      const date = mod.tahunMulai(2024)
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })
  })

  describe("tahunSelesai", () => {
    it("returns Jan 1 of the next year", () => {
      const date = mod.tahunSelesai(2024)
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })
  })

  describe("hinggaAkhirTahun", () => {
    it("returns Dec 31 23:59:59 of the given year", () => {
      const result = mod.hinggaAkhirTahun(2024)
      expect(result.lte.getFullYear()).toBe(2024)
      expect(result.lte.getMonth()).toBe(11)
      expect(result.lte.getDate()).toBe(31)
      expect(result.lte.getHours()).toBe(23)
      expect(result.lte.getMinutes()).toBe(59)
      expect(result.lte.getSeconds()).toBe(59)
    })
  })
})
