import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    anggota: {
      findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
      findMany: vi.fn(), count: vi.fn(),
    },
    user: { findUnique: vi.fn(), create: vi.fn() },
    simpanan: { findMany: vi.fn() },
    pinjaman: { findFirst: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    transaksiSimpanan: { create: vi.fn() },
    akun: { findMany: vi.fn() },
    jurnalUmum: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } }),
}))

vi.mock("@/lib/audit", () => ({ catatLog: vi.fn() }))
vi.mock("@/lib/notifikasi", () => ({ notifyAdmins: vi.fn(), notifyMember: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/utils/file", () => ({ deleteOrphanFiles: vi.fn() }))
vi.mock("@/lib/utils/anggota", () => ({
  generateNoAnggota: vi.fn().mockResolvedValue("001"),
}))
vi.mock("@/lib/struk", () => ({
  generateNoStrukTagihan: vi.fn().mockResolvedValue("STR-001"),
  generateNoStrukSimpanan: vi.fn().mockResolvedValue("STR-001"),
}))
vi.mock("@/actions/simpanan", () => ({
  generateTagihanAnggotaBaru: vi.fn().mockResolvedValue(undefined),
}))

describe("Anggota Flow Integration", () => {
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
  })

  describe("createAnggota", () => {
    let createAnggota: typeof import("@/actions/anggota")["createAnggota"]

    beforeEach(async () => {
      const mod = await import("@/actions/anggota")
      createAnggota = mod.createAnggota
    })

    it("rejects with invalid NIK", async () => {
      await expect(
        createAnggota({ nik: "123", nama: "Test", alamat: "Jl. Test No 123", tglMasuk: "2024-01-15" })
      ).rejects.toThrow()
    })

    it("creates anggota successfully", async () => {
      prisma.anggota.findUnique.mockResolvedValue(null)
      prisma.anggota.count.mockResolvedValue(0)
      prisma.anggota.create.mockResolvedValue({ id: "anggota-1", noAnggota: "001", nik: "1234567890123456" })
      prisma.$transaction.mockImplementation(async (fn: any) =>
        fn({ anggota: { create: prisma.anggota.create, count: prisma.anggota.count }, $queryRawUnsafe: vi.fn() })
      )

      const result = await createAnggota({
        nik: "1234567890123456",
        nama: "Budi Santoso",
        alamat: "Jl. Merdeka No 1, Jakarta",
        tglMasuk: "2024-01-15",
      })
      expect(result.success).toBe(true)
      expect(result.data.noAnggota).toBe("001")
    })

    it("creates anggota with user account when buatUser is true", async () => {
      prisma.anggota.findUnique.mockResolvedValue(null)
      prisma.anggota.count.mockResolvedValue(0)
      prisma.anggota.create.mockResolvedValue({ id: "anggota-1", noAnggota: "001" })
      prisma.user.create.mockResolvedValue({ id: "user-1" })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          anggota: { create: prisma.anggota.create, count: prisma.anggota.count },
          user: { create: prisma.user.create },
          $queryRawUnsafe: vi.fn(),
        }
        return fn(tx)
      })

      const result = await createAnggota({
        nik: "1234567890123456",
        nama: "Budi Santoso",
        alamat: "Jl. Merdeka No 1, Jakarta",
        tglMasuk: "2024-01-15",
        buatUser: true,
        email: "budi@mail.com",
        password: "secret123",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("updateAnggota", () => {
    let updateAnggota: typeof import("@/actions/anggota")["updateAnggota"]

    beforeEach(async () => {
      const mod = await import("@/actions/anggota")
      updateAnggota = mod.updateAnggota
    })

    it("updates anggota successfully", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nik: "1234567890123456", foto: null, ktp: null, noAnggota: "001" })
      prisma.anggota.update.mockResolvedValue({ id: "a1" })

      const result = await updateAnggota({
        id: "a1",
        nik: "1234567890123456",
        nama: "Budi Updated",
        alamat: "Jl. Baru No 10, Jakarta",
        tglMasuk: "2024-01-15",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("updateAnggotaStatus", () => {
    let updateAnggotaStatus: typeof import("@/actions/anggota")["updateAnggotaStatus"]

    beforeEach(async () => {
      const mod = await import("@/actions/anggota")
      updateAnggotaStatus = mod.updateAnggotaStatus
    })

    it("rejects NONAKTIF when anggota has active loan", async () => {
      prisma.pinjaman.count.mockResolvedValue(1)

      await expect(
        updateAnggotaStatus({ id: "a1", status: "NONAKTIF" })
      ).rejects.toThrow("pinjaman aktif")
    })

    it("rejects KELUAR when anggota has active loan", async () => {
      prisma.pinjaman.count.mockResolvedValue(1)

      await expect(
        updateAnggotaStatus({ id: "a1", status: "KELUAR" })
      ).rejects.toThrow("pinjaman aktif")
    })

    it("processes KELUAR with penutupan simpanan", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.pinjaman.count.mockResolvedValue(0)
      prisma.simpanan.findMany.mockResolvedValue([
        { id: "s1", anggotaId: "a1", jenisSimpananId: "j1", saldo: 100000, jenisSimpanan: { kode: "WAJIB" } },
      ])
      prisma.anggota.update.mockResolvedValue({ id: "a1" })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "2.1.2" },
        { id: "akun2", kode: "1.1.1" },
      ])
      prisma.jurnalUmum.create = vi.fn().mockResolvedValue({ id: "jurnal-1" })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          simpanan: { findMany: vi.fn().mockResolvedValue([{ id: "s1", anggotaId: "a1", jenisSimpananId: "j1", saldo: 100000, jenisSimpanan: { kode: "WAJIB" } }]), update: vi.fn() },
          transaksiSimpanan: { create: prisma.transaksiSimpanan.create },
          anggota: { update: prisma.anggota.update },
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: prisma.jurnalUmum.create },
        }
        return fn(tx)
      })

      const resultStatus = await updateAnggotaStatus({ id: "a1", status: "KELUAR" })
      expect(resultStatus.success).toBe(true)
    })

    it("sets AKTIF status directly", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1" })
      prisma.pinjaman.count.mockResolvedValue(0)
      prisma.anggota.update.mockResolvedValue({ id: "a1" })

      const result = await updateAnggotaStatus({ id: "a1", status: "AKTIF" })
      expect(result.success).toBe(true)
    })
  })

  describe("deleteAnggota", () => {
    let deleteAnggota: typeof import("@/actions/anggota")["deleteAnggota"]

    beforeEach(async () => {
      const mod = await import("@/actions/anggota")
      deleteAnggota = mod.deleteAnggota
    })

    it("hard deletes anggota with no related data", async () => {
      prisma.anggota.findUnique
        .mockResolvedValueOnce({ id: "a1", foto: null, ktp: null })
        .mockResolvedValueOnce({ id: "a1", simpanan: [], pinjaman: [] })
      prisma.simpanan.findMany.mockResolvedValue([])
      prisma.pinjaman.findMany.mockResolvedValue([])
      prisma.anggota.delete.mockResolvedValue({ id: "a1" })

      const result = await deleteAnggota("a1")

      expect(result.success).toBe(true)
      expect(result.message).toBe("Anggota berhasil dihapus")
    })

    it("soft deletes (KELUAR) anggota with simpanan data", async () => {
      prisma.anggota.findUnique
        .mockResolvedValueOnce({ id: "a1", foto: "foto.jpg", ktp: null })
        .mockResolvedValueOnce({ id: "a1", simpanan: [{ id: "s1" }], pinjaman: [] })
        .mockResolvedValueOnce({ id: "a1", noAnggota: "001", nama: "Budi" })
      prisma.simpanan.findMany.mockResolvedValue([{ id: "s1", anggotaId: "a1", jenisSimpananId: "j1", saldo: 50000 }])
      prisma.pinjaman.findMany.mockResolvedValue([])
      prisma.pinjaman.count.mockResolvedValue(0)
      prisma.anggota.update.mockResolvedValue({ id: "a1" })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "2.1.2" },
        { id: "akun2", kode: "1.1.1" },
      ])
      prisma.jurnalUmum.create = vi.fn().mockResolvedValue({ id: "jurnal-1" })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          simpanan: { findMany: vi.fn().mockResolvedValue([{ id: "s1", anggotaId: "a1", jenisSimpananId: "j1", saldo: 50000, jenisSimpanan: { kode: "WAJIB" } }]), update: vi.fn() },
          transaksiSimpanan: { create: vi.fn() },
          anggota: { update: prisma.anggota.update },
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: vi.fn().mockResolvedValue({ id: "jurnal-1" }) },
        }
        return fn(tx)
      })

      const result = await deleteAnggota("a1")

      expect(result.success).toBe(true)
      expect(result.message).toContain("KELUAR")
    })
  })
})
