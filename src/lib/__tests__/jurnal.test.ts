/**
 * @file src/lib/__tests__/jurnal.test.ts
 * @description Unit test untuk menguji fungsionalitas jurnal.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn(),
}))

describe("jurnal utilities", () => {
  let getSimpananAkun: typeof import("@/lib/jurnal")["getSimpananAkun"]
  let COA_SIMPANAN_POKOK: string
  let COA_SIMPANAN_WAJIB: string
  let COA_SIMPANAN_SUKARELA: string
  let COA_KAS: string
  let COA_BANK: string
  let COA_PIUTANG_PINJAMAN: string
  let COA_PENDAPATAN_JASA: string
  let COA_PENDAPATAN_DENDA: string

  beforeEach(async () => {
    const mod = await import("@/lib/jurnal")
    getSimpananAkun = mod.getSimpananAkun
    COA_SIMPANAN_POKOK = mod.COA_SIMPANAN_POKOK
    COA_SIMPANAN_WAJIB = mod.COA_SIMPANAN_WAJIB
    COA_SIMPANAN_SUKARELA = mod.COA_SIMPANAN_SUKARELA
    COA_KAS = mod.COA_KAS
    COA_BANK = mod.COA_BANK
    COA_PIUTANG_PINJAMAN = mod.COA_PIUTANG_PINJAMAN
    COA_PENDAPATAN_JASA = mod.COA_PENDAPATAN_JASA
    COA_PENDAPATAN_DENDA = mod.COA_PENDAPATAN_DENDA
  })

  describe("COA constants", () => {
    it("has correct account codes", () => {
      expect(COA_KAS).toBe("1.1.1")
      expect(COA_BANK).toBe("1.1.2")
      expect(COA_SIMPANAN_POKOK).toBe("2.1.1")
      expect(COA_SIMPANAN_WAJIB).toBe("2.1.2")
      expect(COA_SIMPANAN_SUKARELA).toBe("2.1.3")
      expect(COA_PIUTANG_PINJAMAN).toBe("1.2.1")
      expect(COA_PENDAPATAN_JASA).toBe("4.1.1")
      expect(COA_PENDAPATAN_DENDA).toBe("4.1.3")
    })
  })

  describe("getSimpananAkun", () => {
    it("returns POKOK account for POKOK type", () => {
      expect(getSimpananAkun("POKOK")).toBe(COA_SIMPANAN_POKOK)
    })

    it("returns WAJIB account for WAJIB type", () => {
      expect(getSimpananAkun("WAJIB")).toBe(COA_SIMPANAN_WAJIB)
    })

    it("returns SUKARELA account for SUKARELA type", () => {
      expect(getSimpananAkun("SUKARELA")).toBe(COA_SIMPANAN_SUKARELA)
    })

    it("throws error for unknown type", () => {
      expect(() => getSimpananAkun("UNKNOWN")).toThrow("Jenis simpanan tidak dikenal")
      expect(() => getSimpananAkun("UNKNOWN")).toThrow("UNKNOWN")
    })
  })
})
