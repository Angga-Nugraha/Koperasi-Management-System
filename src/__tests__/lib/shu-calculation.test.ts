import { describe, it, expect, vi, beforeEach } from "vitest"
import { round2 } from "@/lib/math"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    detailJurnal: { findMany: vi.fn() },
    simpanan: { findMany: vi.fn() },
    angsuran: { findMany: vi.fn() },
    anggota: { findMany: vi.fn() },
    indikatorSHU: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn(),
}))

describe("SHU Calculation", () => {
  let hitungSHU: typeof import("@/lib/shu")["hitungSHU"]
  let getTotalPendapatanBeban: typeof import("@/lib/shu")["getTotalPendapatanBeban"]
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
    const mod = await import("@/lib/shu")
    hitungSHU = mod.hitungSHU
    getTotalPendapatanBeban = mod.getTotalPendapatanBeban
  })

  describe("getTotalPendapatanBeban", () => {
    it("calculates total from PENDAPATAN and BEBAN accounts", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 0, kredit: 100000, akun: { tipe: "PENDAPATAN" } },
        { id: "d2", debit: 0, kredit: 50000, akun: { tipe: "PENDAPATAN" } },
        { id: "d3", debit: 30000, kredit: 0, akun: { tipe: "BEBAN" } },
      ])

      const result = await getTotalPendapatanBeban(2024)
      expect(result.totalPendapatan).toBe(150000)
      expect(result.totalBeban).toBe(30000)
      expect(result.totalSHU).toBe(120000)
    })

    it("handles PENDAPATAN with debit (returns)", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 0, kredit: 200000, akun: { tipe: "PENDAPATAN" } },
        { id: "d2", debit: 50000, kredit: 0, akun: { tipe: "PENDAPATAN" } },
      ])

      const result = await getTotalPendapatanBeban(2024)
      expect(result.totalPendapatan).toBe(150000)
    })

    it("handles BEBAN with kredit (contra-expense)", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 100000, kredit: 0, akun: { tipe: "BEBAN" } },
        { id: "d2", debit: 0, kredit: 20000, akun: { tipe: "BEBAN" } },
      ])

      const result = await getTotalPendapatanBeban(2024)
      expect(result.totalBeban).toBe(80000)
    })

    it("returns zero SHU when expenses exceed income", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 0, kredit: 100000, akun: { tipe: "PENDAPATAN" } },
        { id: "d2", debit: 200000, kredit: 0, akun: { tipe: "BEBAN" } },
      ])

      const result = await getTotalPendapatanBeban(2024)
      expect(result.totalPendapatan).toBe(100000)
      expect(result.totalBeban).toBe(200000)
      expect(result.totalSHU).toBe(-100000)
    })

    it("handles empty result set", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([])

      const result = await getTotalPendapatanBeban(2024)
      expect(result.totalPendapatan).toBe(0)
      expect(result.totalBeban).toBe(0)
      expect(result.totalSHU).toBe(0)
    })
  })

  describe("hitungSHU", () => {
    it("throws error when no active indikator", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([])
      prisma.indikatorSHU.findMany.mockResolvedValue([])

      await expect(hitungSHU(2024)).rejects.toThrow("Belum ada indikator SHU yang aktif")
    })

    it("calculates SHU distribution for one anggota", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 0, kredit: 1000000, akun: { tipe: "PENDAPATAN" } },
      ])
      prisma.simpanan.findMany.mockResolvedValue([
        { anggotaId: "a1", saldo: 500000 },
      ])
      prisma.angsuran.findMany.mockResolvedValue([
        { id: "a1", pokok: 200000, pinjaman: { anggotaId: "a1" }, status: "LUNAS", tglBayar: new Date("2024-06-15") },
      ])
      prisma.anggota.findMany.mockResolvedValue([
        { id: "a1", nama: "John Doe", noAnggota: "001" },
      ])
      prisma.indikatorSHU.findMany.mockResolvedValue([
        { id: "i1", kode: "JM", nama: "Jasa Modal", persentase: 50, kelompok: "ANGGOTA", akunId: null, urutan: 1, isActive: true },
        { id: "i2", kode: "JU", nama: "Jasa Usaha", persentase: 50, kelompok: "ANGGOTA", akunId: null, urutan: 2, isActive: true },
      ])

      const result = await hitungSHU(2024)

      expect(result.keuangan.totalPendapatan).toBe(1000000)
      expect(result.keuangan.totalSHU).toBe(1000000)
      expect(result.totalAnggota).toBe(1)

      expect(result.alokasi.JM.nominal).toBe(500000)
      expect(result.alokasi.JU.nominal).toBe(500000)

      expect(result.perAnggota[0].jasaModal).toBe(round2(500000 * (500000 / 500000)))
      expect(result.perAnggota[0].jasaUsaha).toBe(round2(500000 * (200000 / 200000)))
      expect(result.perAnggota[0].total).toBe(1000000)
    })

    it("distributes SHU proportionally among multiple anggota", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 0, kredit: 1000000, akun: { tipe: "PENDAPATAN" } },
      ])
      prisma.simpanan.findMany.mockResolvedValue([
        { anggotaId: "a1", saldo: 300000 },
        { anggotaId: "a2", saldo: 200000 },
      ])
      prisma.angsuran.findMany.mockResolvedValue([
        { id: "a1", pokok: 100000, pinjaman: { anggotaId: "a1" }, status: "LUNAS", tglBayar: new Date("2024-06-15") },
        { id: "a2", pokok: 100000, pinjaman: { anggotaId: "a2" }, status: "LUNAS", tglBayar: new Date("2024-06-15") },
      ])
      prisma.anggota.findMany.mockResolvedValue([
        { id: "a1", nama: "Alice", noAnggota: "001" },
        { id: "a2", nama: "Bob", noAnggota: "002" },
      ])
      prisma.indikatorSHU.findMany.mockResolvedValue([
        { id: "i1", kode: "JM", nama: "Jasa Modal", persentase: 50, kelompok: "ANGGOTA", akunId: null, urutan: 1, isActive: true },
        { id: "i2", kode: "JU", nama: "Jasa Usaha", persentase: 50, kelompok: "ANGGOTA", akunId: null, urutan: 2, isActive: true },
      ])

      const result = await hitungSHU(2024)

      const totalSimpanan = 500000
      const totalAngsuran = 200000
      const shuBersih = 1000000
      const danaJM = shuBersih * 0.5
      const danaJU = shuBersih * 0.5

      expect(result.perAnggota[0].jasaModal).toBe(round2(danaJM * (300000 / totalSimpanan)))
      expect(result.perAnggota[0].jasaUsaha).toBe(round2(danaJU * (100000 / totalAngsuran)))
      expect(result.perAnggota[1].jasaModal).toBe(round2(danaJM * (200000 / totalSimpanan)))
      expect(result.perAnggota[1].jasaUsaha).toBe(round2(danaJU * (100000 / totalAngsuran)))
    })

    it("handles loss (negative SHU) by using max(0, SHU)", async () => {
      prisma.detailJurnal.findMany.mockResolvedValue([
        { id: "d1", debit: 0, kredit: 500000, akun: { tipe: "PENDAPATAN" } },
        { id: "d2", debit: 1000000, kredit: 0, akun: { tipe: "BEBAN" } },
      ])
      prisma.simpanan.findMany.mockResolvedValue([])
      prisma.angsuran.findMany.mockResolvedValue([])
      prisma.anggota.findMany.mockResolvedValue([])
      prisma.indikatorSHU.findMany.mockResolvedValue([
        { id: "i1", kode: "CAD", nama: "Cadangan", persentase: 100, kelompok: "DANA", akunId: null, urutan: 1, isActive: true },
      ])

      const result = await hitungSHU(2024)

      expect(result.keuangan.totalSHU).toBe(-500000)
      expect(result.alokasi.CAD.nominal).toBe(0)
    })
  })
})
