/**
 * @file src/lib/__tests__/date.test.ts
 * @description Unit test untuk menguji fungsionalitas date.
 */

import { describe, it, expect } from "vitest"
import { tahunRange, tahunMulai, tahunSelesai, hinggaAkhirTahun } from "@/lib/date"

describe("date utilities", () => {
  describe("tahunRange", () => {
    it("returns correct date range for a given year", () => {
      const range = tahunRange(2024)
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
      const date = tahunMulai(2024)
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })
  })

  describe("tahunSelesai", () => {
    it("returns Jan 1 of the next year", () => {
      const date = tahunSelesai(2024)
      expect(date.getFullYear()).toBe(2025)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })
  })

  describe("hinggaAkhirTahun", () => {
    it("returns Dec 31 23:59:59 of the given year", () => {
      const result = hinggaAkhirTahun(2024)
      expect(result.lte.getFullYear()).toBe(2024)
      expect(result.lte.getMonth()).toBe(11)
      expect(result.lte.getDate()).toBe(31)
      expect(result.lte.getHours()).toBe(23)
      expect(result.lte.getMinutes()).toBe(59)
      expect(result.lte.getSeconds()).toBe(59)
    })
  })
})
