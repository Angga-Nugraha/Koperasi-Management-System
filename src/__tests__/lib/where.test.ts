/**
 * @file src/lib/__tests__/where.test.ts
 * @description Unit test untuk menguji fungsionalitas where.
 */

import { describe, it, expect } from "vitest"
import { jurnalFilter, anggotaFilter, detailJurnalFilter, anggotaTanggalFilter } from "@/lib/where"

describe("filter builders", () => {
  describe("jurnalFilter", () => {
    it("returns empty filter when no params", () => {
      expect(jurnalFilter({})).toEqual({})
    })

    it("builds search filter with OR conditions", () => {
      const result = jurnalFilter({ search: "test" })
      expect(result.OR).toBeDefined()
      expect(result.OR).toHaveLength(2)
    })

    it("builds date range filter", () => {
      const result = jurnalFilter({ dari: "2024-01-01", sampai: "2024-12-31" })
      expect(result.tanggal).toBeDefined()
      const tanggal = result.tanggal as { gte: Date; lte: Date }
      expect(tanggal.gte).toEqual(new Date("2024-01-01"))
      expect(tanggal.lte).toEqual(new Date("2024-12-31"))
    })
  })

  describe("anggotaFilter", () => {
    it("returns empty filter when no params", () => {
      expect(anggotaFilter({})).toEqual({})
    })

    it("skips status filter when SEMUA", () => {
      const result = anggotaFilter({ status: "SEMUA" })
      expect(result.status).toBeUndefined()
    })

    it("applies status filter for AKTIF", () => {
      const result = anggotaFilter({ status: "AKTIF" })
      expect(result.status).toBe("AKTIF")
    })

    it("builds search filter with OR across 3 fields", () => {
      const result = anggotaFilter({ search: "John" })
      expect(result.OR).toHaveLength(3)
    })
  })

  describe("detailJurnalFilter", () => {
    it("returns empty filter when no params", () => {
      expect(detailJurnalFilter({})).toEqual({})
    })

    it("filters by akunId", () => {
      const result = detailJurnalFilter({ akunId: "abc-123" })
      expect(result.akunId).toBe("abc-123")
    })

    it("filters by multiple akunIds", () => {
      const result = detailJurnalFilter({ akunIds: ["a1", "a2"] })
      expect(result.akunId).toEqual({ in: ["a1", "a2"] })
    })

    it("excludes closing journal entries", () => {
      const result = detailJurnalFilter({ excludeClosing: true })
      expect(result.jurnal).toBeDefined()
      expect(result.jurnal!.keterangan).toEqual({ not: { contains: "Jurnal Penutup" } })
    })

    it("filters by date range", () => {
      const dari = new Date("2024-01-01")
      const sampai = new Date("2024-12-31")
      const result = detailJurnalFilter({ dariTanggal: dari, sampaiTanggal: sampai })
      expect(result.jurnal?.tanggal).toEqual({ gte: dari, lte: sampai })
    })
  })

  describe("anggotaTanggalFilter", () => {
    it("creates a same-day date range", () => {
      const date = new Date("2024-06-15T10:30:00")
      const result = anggotaTanggalFilter(date)
      expect(result.gte.getTime()).toBe(date.getTime())
      expect(result.lt.getTime()).toBe(date.getTime() + 86400000)
    })
  })
})
