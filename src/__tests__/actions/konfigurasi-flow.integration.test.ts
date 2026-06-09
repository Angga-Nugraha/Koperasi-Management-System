import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    akun: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    konfigurasi: { findMany: vi.fn(), findUnique: vi.fn(), upsert: vi.fn() },
    jenisPinjaman: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    jenisSimpanan: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    generalInfo: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    pinjaman: { count: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "admin-1", email: "admin@test.com" } }),
}))

vi.mock("@/lib/audit", () => ({ catatLog: vi.fn() }))
vi.mock("@/lib/konfig", () => ({ getKonfig: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("Konfigurasi Flow Integration", () => {
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
  })

  describe("createAkun", () => {
    let createAkun: (typeof import("@/actions/konfigurasi"))["createAkun"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      createAkun = mod.createAkun
    })

    it("rejects duplicate kode", async () => {
      prisma.akun.findUnique.mockResolvedValue({ id: "existing", kode: "1.1.1" })

      await expect(
        createAkun({ kode: "1.1.1", nama: "Kas", tipe: "ASET", saldoNormal: "DEBIT" }),
      ).rejects.toThrow("Kode akun sudah ada")
    })

    it("creates akun successfully", async () => {
      prisma.akun.findUnique.mockResolvedValue(null)
      prisma.akun.create.mockResolvedValue({ id: "akun-1", kode: "9.9.9", nama: "Akun Baru" })

      const result = await createAkun({
        kode: "9.9.9",
        nama: "Akun Baru",
        tipe: "ASET",
        saldoNormal: "DEBIT",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("toggleAkunActive", () => {
    let toggleAkunActive: (typeof import("@/actions/konfigurasi"))["toggleAkunActive"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      toggleAkunActive = mod.toggleAkunActive
    })

    it("toggles akun active status", async () => {
      prisma.akun.findUnique.mockResolvedValue({ id: "akun-1", isActive: false })
      prisma.akun.update.mockResolvedValue({ id: "akun-1", isActive: true })

      const result = await toggleAkunActive("akun-1")

      expect(result.success).toBe(true)
    })

    it("rejects when akun not found", async () => {
      prisma.akun.findUnique.mockResolvedValue(null)

      await expect(toggleAkunActive("nonexistent")).rejects.toThrow("Akun tidak ditemukan")
    })
  })

  describe("createJenisPinjaman", () => {
    let createJenisPinjaman: (typeof import("@/actions/konfigurasi"))["createJenisPinjaman"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      createJenisPinjaman = mod.createJenisPinjaman
    })

    it("rejects duplicate nama", async () => {
      prisma.jenisPinjaman.findUnique.mockResolvedValue({ id: "existing", nama: "Reguler" })

      await expect(
        createJenisPinjaman({ nama: "Reguler", bunga: 1.5, keterangan: "" }),
      ).rejects.toThrow("Nama jenis pinjaman sudah ada")
    })

    it("creates jenis pinjaman successfully", async () => {
      prisma.jenisPinjaman.findUnique.mockResolvedValue(null)
      prisma.jenisPinjaman.create.mockResolvedValue({ id: "jp-1", nama: "Baru" })

      const result = await createJenisPinjaman({ nama: "Baru", bunga: 2.0, keterangan: "Test" })

      expect(result.success).toBe(true)
    })
  })

  describe("deleteJenisPinjaman", () => {
    let deleteJenisPinjaman: (typeof import("@/actions/konfigurasi"))["deleteJenisPinjaman"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      deleteJenisPinjaman = mod.deleteJenisPinjaman
    })

    it("rejects deletion when jenis masih dipakai", async () => {
      prisma.pinjaman.count.mockResolvedValue(3)

      await expect(deleteJenisPinjaman("jp-1")).rejects.toThrow("Tidak bisa dihapus")
    })

    it("deletes jenis pinjaman when unused", async () => {
      prisma.pinjaman.count.mockResolvedValue(0)
      prisma.jenisPinjaman.delete.mockResolvedValue({ id: "jp-1" })

      const result = await deleteJenisPinjaman("jp-1")

      expect(result.success).toBe(true)
    })
  })

  describe("createJenisSimpanan", () => {
    let createJenisSimpanan: (typeof import("@/actions/konfigurasi"))["createJenisSimpanan"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      createJenisSimpanan = mod.createJenisSimpanan
    })

    it("rejects duplicate kode", async () => {
      prisma.jenisSimpanan.findUnique.mockResolvedValue({ id: "existing", kode: "WAJIB" })

      await expect(
        createJenisSimpanan({
          kode: "WAJIB",
          nama: "Wajib",
          minimalSetoran: 50000,
          keterangan: "",
        }),
      ).rejects.toThrow("Kode jenis simpanan sudah ada")
    })

    it("creates jenis simpanan successfully", async () => {
      prisma.jenisSimpanan.findUnique.mockResolvedValue(null)
      prisma.jenisSimpanan.findFirst.mockResolvedValue({ urutan: 5 })
      prisma.jenisSimpanan.create.mockResolvedValue({ id: "js-1", kode: "NEW" })

      const result = await createJenisSimpanan({
        kode: "NEW",
        nama: "Baru",
        minimalSetoran: 25000,
        keterangan: "",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("updateKonfig", () => {
    let updateKonfig: (typeof import("@/actions/konfigurasi"))["updateKonfig"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      updateKonfig = mod.updateKonfig
    })

    it("upserts konfigurasi value", async () => {
      prisma.konfigurasi.findUnique.mockResolvedValue(null)
      prisma.konfigurasi.upsert.mockResolvedValue({ key: "test_key", value: "test_val" })

      const result = await updateKonfig("test_key", "test_val")

      expect(result.success).toBe(true)
    })
  })

  describe("updateGeneralInfo", () => {
    let updateGeneralInfo: (typeof import("@/actions/konfigurasi"))["updateGeneralInfo"]

    beforeEach(async () => {
      const mod = await import("@/actions/konfigurasi")
      updateGeneralInfo = mod.updateGeneralInfo
    })

    it("updates existing general info", async () => {
      prisma.generalInfo.findFirst.mockResolvedValue({ id: "gi-1", namaKoperasi: "Old" })
      prisma.generalInfo.update.mockResolvedValue({ id: "gi-1" })

      const result = await updateGeneralInfo({ namaKoperasi: "Koperasi Baru", alamat: "Jl. Baru" })

      expect(result.success).toBe(true)
    })

    it("creates general info when none exists", async () => {
      prisma.generalInfo.findFirst.mockResolvedValue(null)
      prisma.generalInfo.create.mockResolvedValue({ id: "gi-1" })

      const result = await updateGeneralInfo({ namaKoperasi: "Koperasi Baru", alamat: "Jl. Baru" })

      expect(result.success).toBe(true)
    })
  })
})
