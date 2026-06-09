import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn(),
}))

describe("jurnal utilities", () => {
  let getSimpananAkun: (typeof import("@/lib/jurnal"))["getSimpananAkun"]
  let COA_SIMPANAN_POKOK: string
  let COA_SIMPANAN_WAJIB: string
  let COA_SIMPANAN_SUKARELA: string
  let COA_KAS: string
  let COA_BANK: string
  let COA_PIUTANG_PINJAMAN: string
  let COA_PENDAPATAN_JASA: string
  let COA_PENDAPATAN_DENDA: string
  let COA_KAS_BANK: readonly string[]
  let COA_SHU_BERJALAN: string
  let COA_SHU_DITAHAN: string

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
    COA_KAS_BANK = mod.COA_KAS_BANK
    COA_SHU_BERJALAN = mod.COA_SHU_BERJALAN
    COA_SHU_DITAHAN = mod.COA_SHU_DITAHAN
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

    it("has SHU account codes", () => {
      expect(COA_SHU_BERJALAN).toBe("3.1.2")
      expect(COA_SHU_DITAHAN).toBe("3.1.3")
    })

    it("COA_KAS_BANK includes kas and all bank accounts", () => {
      expect(COA_KAS_BANK).toContain("1.1.1")
      expect(COA_KAS_BANK).toContain("1.1.2")
      expect(COA_KAS_BANK).toContain("1.1.3")
      expect(COA_KAS_BANK).toContain("1.1.4")
      expect(COA_KAS_BANK).toHaveLength(4)
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

    it("returns default SUKARELA for unknown type instead of throwing", () => {
      expect(getSimpananAkun("UNKNOWN")).toBe(COA_SIMPANAN_SUKARELA)
    })
  })

  describe("buatJurnal - balance validation", () => {
    let buatJurnal: (typeof import("@/lib/jurnal"))["buatJurnal"]

    beforeEach(async () => {
      const mod = await import("@/lib/jurnal")
      buatJurnal = mod.buatJurnal
    })

    it("accepts balanced entries (debit = kredit)", async () => {
      const tx = {
        akun: { findMany: vi.fn().mockResolvedValue([{ id: "akun1", kode: "1.1.1" }]) },
        jurnalUmum: { create: vi.fn().mockResolvedValue({}) },
      }
      await expect(
        buatJurnal(tx as any, {
          tanggal: new Date("2024-01-15"),
          keterangan: "Test",
          entries: [{ akunKode: "1.1.1", debit: 50000, kredit: 50000 }],
        }),
      ).resolves.toBeDefined()
    })

    it("rejects unbalanced entries where debit > kredit", async () => {
      const tx = {
        akun: { findMany: vi.fn().mockResolvedValue([{ id: "akun1", kode: "1.1.1" }]) },
        jurnalUmum: { create: vi.fn() },
      }
      await expect(
        buatJurnal(tx as any, {
          tanggal: new Date("2024-01-15"),
          keterangan: "Test",
          entries: [{ akunKode: "1.1.1", debit: 100000, kredit: 50000 }],
        }),
      ).rejects.toThrow("Jurnal tidak balance")
    })

    it("rejects unbalanced entries where kredit > debit", async () => {
      const tx = {
        akun: { findMany: vi.fn().mockResolvedValue([{ id: "akun1", kode: "1.1.1" }]) },
        jurnalUmum: { create: vi.fn() },
      }
      await expect(
        buatJurnal(tx as any, {
          tanggal: new Date("2024-01-15"),
          keterangan: "Test",
          entries: [{ akunKode: "1.1.1", debit: 30000, kredit: 60000 }],
        }),
      ).rejects.toThrow("Jurnal tidak balance")
    })

    it("throws error when account kode not found", async () => {
      const tx = {
        akun: { findMany: vi.fn().mockResolvedValue([]) },
        jurnalUmum: { create: vi.fn() },
      }
      await expect(
        buatJurnal(tx as any, {
          tanggal: new Date("2024-01-15"),
          keterangan: "Test",
          entries: [{ akunKode: "99.99.99", debit: 50000, kredit: 50000 }],
        }),
      ).rejects.toThrow("Akun dengan kode 99.99.99 tidak ditemukan")
    })

    it("generates a noJurnal with correct prefix", async () => {
      const tx = {
        akun: { findMany: vi.fn().mockResolvedValue([{ id: "akun1", kode: "1.1.1" }]) },
        jurnalUmum: { create: vi.fn().mockImplementation(async (data: any) => data) },
      }
      const result = await buatJurnal(tx as any, {
        tanggal: new Date("2024-01-15"),
        keterangan: "Test",
        entries: [{ akunKode: "1.1.1", debit: 50000, kredit: 50000 }],
      })
      expect(result).toMatch(/^JRN-20240115-/)
    })
  })
})
