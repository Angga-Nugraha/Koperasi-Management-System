import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    sHU: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    shuAnggota: { findMany: vi.fn() },
    indikatorSHU: { findMany: vi.fn() },
    akun: { findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn() },
    detailJurnal: { findMany: vi.fn() },
    jenisSimpanan: { findFirst: vi.fn() },
    simpanan: { upsert: vi.fn() },
    transaksiSimpanan: { create: vi.fn() },
    jurnalUmum: { create: vi.fn() },
    anggota: { findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } }),
  auth: vi.fn().mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } }),
}))

vi.mock("@/lib/audit", () => ({ catatLog: vi.fn() }))
vi.mock("@/lib/notifikasi", () => ({ notifyAdmins: vi.fn(), notifyMember: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("Tutup Buku Flow Integration", () => {
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
  })

  describe("prosesTutupBuku", () => {
    let prosesTutupBuku: typeof import("@/actions/tutup-buku")["prosesTutupBuku"]

    beforeEach(async () => {
      const mod = await import("@/actions/tutup-buku")
      prosesTutupBuku = mod.prosesTutupBuku
    })

    it("rejects when SHU not found", async () => {
      prisma.sHU.findUnique.mockResolvedValue(null)
      await expect(prosesTutupBuku(2024)).rejects.toThrow("SHU")
    })

    it("rejects when SHU already FINAL", async () => {
      prisma.sHU.findUnique.mockResolvedValue({ id: "shu-1", tahun: 2024, status: "FINAL" })
      await expect(prosesTutupBuku(2024)).rejects.toThrow("sudah ditutup")
    })

    it("rejects when COA_SHU_BERJALAN not found", async () => {
      prisma.sHU.findUnique.mockResolvedValue({ id: "shu-1", tahun: 2024, status: "DRAFT", total: 1000000 })
      prisma.akun.findFirst.mockResolvedValue(null)

      await expect(prosesTutupBuku(2024)).rejects.toThrow("Akun SHU Tahun Berjalan")
    })
  })

  describe("getSHUTutupBukuList", () => {
    let getSHUTutupBukuList: typeof import("@/actions/tutup-buku")["getSHUTutupBukuList"]

    beforeEach(async () => {
      const mod = await import("@/actions/tutup-buku")
      getSHUTutupBukuList = mod.getSHUTutupBukuList
    })

    it("returns list of SHU records", async () => {
      prisma.sHU.findMany.mockResolvedValue([
        { id: "shu-1", tahun: 2024, total: 1000000, status: "DRAFT", _count: { shuAnggota: 5 } },
      ])
      const result = await getSHUTutupBukuList()
      expect(result).toHaveLength(1)
      expect(result[0].tahun).toBe(2024)
    })
  })
})
