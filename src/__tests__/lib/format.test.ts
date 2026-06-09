/**
 * @file src/lib/__tests__/format.test.ts
 * @description Unit test untuk menguji fungsionalitas format.
 */

import { describe, it, expect } from "vitest"
import { formatTanggal, formatCompact } from "@/lib/format"

describe("format utilities", () => {
  describe("formatTanggal", () => {
    it("formats a Date object correctly", () => {
      const date = new Date(2024, 0, 15)
      expect(formatTanggal(date)).toBe("15/01/2024")
    })

    it("formats an ISO date string correctly", () => {
      expect(formatTanggal("2024-12-25T00:00:00.000Z")).toBe("25/12/2024")
    })

    it("pads single-digit day and month", () => {
      const date = new Date(2024, 2, 5)
      expect(formatTanggal(date)).toBe("05/03/2024")
    })
  })

  describe("formatCompact", () => {
    it("formats numbers less than 1000", () => {
      expect(formatCompact(999)).toBe("999")
    })

    it("formats thousands as K", () => {
      expect(formatCompact(1500)).toBe("1.5K")
    })

    it("formats millions as M", () => {
      expect(formatCompact(2500000)).toBe("2.5M")
    })

    it("formats billions as B", () => {
      expect(formatCompact(3500000000)).toBe("3.5B")
    })

    it("formats trillions as T", () => {
      expect(formatCompact(4500000000000)).toBe("4.5T")
    })

    it("removes trailing .0", () => {
      expect(formatCompact(1000)).toBe("1K")
      expect(formatCompact(1000000)).toBe("1M")
    })

    it("handles zero", () => {
      expect(formatCompact(0)).toBe("0")
    })
  })
})
