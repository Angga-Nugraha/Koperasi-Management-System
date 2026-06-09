import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    akun: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    jurnalUmum: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    detailJurnal: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn(), aggregate: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } }),
  auth: vi.fn().mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } }),
}))

vi.mock("@/lib/audit", () => ({ catatLog: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const mockGetSaldoAkunTipe = vi.fn()
vi.mock("@/lib/jurnal", async () => {
  const actual = await vi.importActual("@/lib/jurnal")
  return { ...actual, getSaldoAkunTipe: mockGetSaldoAkunTipe }
})

describe("Jurnal Flow Integration", () => {
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
  })

  describe("createJurnalManual", () => {
    let createJurnalManual: (typeof import("@/actions/jurnal"))["createJurnalManual"]

    beforeEach(async () => {
      const mod = await import("@/actions/jurnal")
      createJurnalManual = mod.createJurnalManual
    })

    it("rejects invalid input (single entry)", async () => {
      await expect(
        createJurnalManual({
          tanggal: "2024-01-15",
          keterangan: "Test",
          entries: [{ akunId: "akun1", debit: 50000, kredit: 50000 }],
        }),
      ).rejects.toThrow()
    })

    it("rejects when akun not found", async () => {
      prisma.akun.findMany.mockResolvedValue([])
      await expect(
        createJurnalManual({
          tanggal: "2024-01-15",
          keterangan: "Test",
          entries: [
            { akunId: "akun1", debit: 50000, kredit: 0 },
            { akunId: "akun2", debit: 0, kredit: 50000 },
          ],
        }),
      ).rejects.toThrow()
    })

    it("creates jurnal manual successfully", async () => {
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "1.1.1" },
        { id: "akun2", kode: "2.1.2" },
      ])
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: prisma.jurnalUmum.create },
        }
        return fn(tx)
      })

      const result = await createJurnalManual({
        tanggal: "2024-01-15",
        keterangan: "Test Jurnal",
        entries: [
          { akunId: "akun1", debit: 100000, kredit: 0 },
          { akunId: "akun2", debit: 0, kredit: 100000 },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe("getLabaRugi", () => {
    let getLabaRugi: (typeof import("@/actions/jurnal"))["getLabaRugi"]

    beforeEach(async () => {
      const mod = await import("@/actions/jurnal")
      getLabaRugi = mod.getLabaRugi
    })

    it("returns laba-rugi structure", async () => {
      mockGetSaldoAkunTipe
        .mockResolvedValueOnce({ items: [], total: 0 })
        .mockResolvedValueOnce({ items: [], total: 0 })

      const result = await getLabaRugi("2024-01-01", "2024-12-31")
      expect(result.pendapatan).toBeDefined()
      expect(result.beban).toBeDefined()
      expect(typeof result.labaBersih).toBe("number")
    })
  })

  describe("getNeraca", () => {
    let getNeraca: (typeof import("@/actions/jurnal"))["getNeraca"]

    beforeEach(async () => {
      const mod = await import("@/actions/jurnal")
      getNeraca = mod.getNeraca
    })

    it("returns neraca structure", async () => {
      mockGetSaldoAkunTipe.mockResolvedValue({ items: [], total: 0 })

      const result = await getNeraca("2024-12-31")
      expect(result.aset).toBeDefined()
      expect(result.aset.total).toBe(0)
      expect(result.liabilitas).toBeDefined()
      expect(result.ekuitas).toBeDefined()
      expect(result.ekuitas.items).toEqual([])
    })
  })

  describe("getAkunList", () => {
    let getAkunList: (typeof import("@/actions/jurnal"))["getAkunList"]

    beforeEach(async () => {
      const mod = await import("@/actions/jurnal")
      getAkunList = mod.getAkunList
    })

    it("returns active akun list", async () => {
      prisma.akun.findMany.mockResolvedValue([
        {
          id: "a1",
          kode: "1.1.1",
          nama: "Kas",
          tipe: "ASET",
          saldoNormal: "DEBIT",
          isActive: true,
        },
      ])
      const result = await getAkunList()
      expect(result).toHaveLength(1)
      expect(result[0].kode).toBe("1.1.1")
    })
  })
})
