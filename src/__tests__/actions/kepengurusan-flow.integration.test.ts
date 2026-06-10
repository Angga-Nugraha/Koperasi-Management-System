import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    kepengurusan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    anggota: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }),
}))

vi.mock("@/lib/audit", () => ({ catatLog: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("Kepengurusan Flow Integration", () => {
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
  })

  describe("tambahJabatan", () => {
    let tambahJabatan: (typeof import("@/actions/kepengurusan"))["tambahJabatan"]

    beforeEach(async () => {
      const mod = await import("@/actions/kepengurusan")
      tambahJabatan = mod.tambahJabatan
    })

    it("rejects invalid jabatan name", async () => {
      await expect(tambahJabatan({ jabatan: "A", tipe: "PENGURUS" })).rejects.toThrow()
    })

    it("rejects invalid tipe", async () => {
      await expect(tambahJabatan({ jabatan: "Ketua", tipe: "INVALID" as any })).rejects.toThrow()
    })

    it("creates new jabatan successfully", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue(null)
      prisma.kepengurusan.aggregate.mockResolvedValue({ _max: { urutan: 5 } })
      prisma.kepengurusan.create.mockResolvedValue({ id: "k-1" })

      const result = await tambahJabatan({ jabatan: "Ketua Baru", tipe: "PENGURUS" })
      expect(result.success).toBe(true)
      expect(prisma.kepengurusan.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ jabatan: "Ketua Baru" }) }),
      )
    })
  })

  describe("upsertKepengurusan", () => {
    let upsertKepengurusan: (typeof import("@/actions/kepengurusan"))["upsertKepengurusan"]

    beforeEach(async () => {
      const mod = await import("@/actions/kepengurusan")
      upsertKepengurusan = mod.upsertKepengurusan
    })

    it("rejects when jabatan not found", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue(null)
      await expect(upsertKepengurusan({ jabatan: "X", anggotaId: "a1" })).rejects.toThrow(
        "Jabatan tidak ditemukan",
      )
    })

    it("rejects when anggota not found", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue({ id: "k-1", jabatan: "Ketua" })
      prisma.anggota.findUnique.mockResolvedValue(null)
      await expect(upsertKepengurusan({ jabatan: "Ketua", anggotaId: "x" })).rejects.toThrow(
        "Anggota tidak ditemukan",
      )
    })

    it("assigns anggota to jabatan", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue({
        id: "k-1",
        jabatan: "Ketua",
        anggotaId: null,
        tipe: "PENGURUS",
        urutan: 1,
      })
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi" })
      prisma.kepengurusan.update.mockResolvedValue({ id: "k-1", anggotaId: "a1" })

      const result = await upsertKepengurusan({ jabatan: "Ketua", anggotaId: "a1" })
      expect(result.success).toBe(true)
      expect(prisma.kepengurusan.update).toHaveBeenCalled()
    })
  })

  describe("kosongkanJabatan", () => {
    let kosongkanJabatan: (typeof import("@/actions/kepengurusan"))["kosongkanJabatan"]

    beforeEach(async () => {
      const mod = await import("@/actions/kepengurusan")
      kosongkanJabatan = mod.kosongkanJabatan
    })

    it("removes anggota from jabatan", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue({
        id: "k-1",
        jabatan: "Ketua",
        anggotaId: "a1",
        tipe: "PENGURUS",
        urutan: 1,
      })
      prisma.kepengurusan.update.mockResolvedValue({ id: "k-1", anggotaId: null })
      const result = await kosongkanJabatan("k-1")
      expect(result.success).toBe(true)
      expect(prisma.kepengurusan.update).toHaveBeenCalled()
    })
  })

  describe("hapusJabatan", () => {
    let hapusJabatan: (typeof import("@/actions/kepengurusan"))["hapusJabatan"]

    beforeEach(async () => {
      const mod = await import("@/actions/kepengurusan")
      hapusJabatan = mod.hapusJabatan
    })

    it("deletes jabatan", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue({
        id: "k-1",
        jabatan: "Ketua",
        tipe: "PENGURUS",
        urutan: 1,
      })
      prisma.kepengurusan.delete.mockResolvedValue({ id: "k-1" })
      const result = await hapusJabatan("k-1")
      expect(result.success).toBe(true)
      expect(prisma.kepengurusan.delete).toHaveBeenCalled()
    })

    it("rejects when jabatan not found", async () => {
      prisma.kepengurusan.findUnique.mockResolvedValue(null)
      await expect(hapusJabatan("x")).rejects.toThrow("Data tidak ditemukan")
    })
  })

  describe("getKepengurusanList", () => {
    let getKepengurusanList: (typeof import("@/actions/kepengurusan"))["getKepengurusanList"]

    beforeEach(async () => {
      const mod = await import("@/actions/kepengurusan")
      getKepengurusanList = mod.getKepengurusanList
    })

    it("returns ordered list with anggota data", async () => {
      prisma.kepengurusan.findMany.mockResolvedValue([
        {
          id: "k-1",
          jabatan: "Ketua",
          tipe: "PENGURUS",
          urutan: 1,
          anggota: { id: "a1", nama: "Budi", noAnggota: "001", nik: "1234" },
        },
        { id: "k-2", jabatan: "Sekretaris", tipe: "PENGURUS", urutan: 2, anggota: null },
      ])
      const result = await getKepengurusanList()
      expect(result).toHaveLength(2)
      expect(result[0]!.anggota?.nama).toBe("Budi")
      expect(result[1]!.anggota).toBeNull()
    })
  })
})
