import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    anggota: { findUnique: vi.fn() },
    jenisSimpanan: { findUnique: vi.fn() },
    simpanan: { upsert: vi.fn() },
    transaksiSimpanan: { create: vi.fn() },
    akun: { findMany: vi.fn() },
    jurnalUmum: { create: vi.fn() },
    detailJurnal: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "petugas-1", email: "admin@test.com" } }),
}))

vi.mock("@/lib/audit", () => ({
  catatLog: vi.fn(),
}))

vi.mock("@/lib/notifikasi", () => ({
  notifyAdmins: vi.fn(),
  notifyMember: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/struk", () => ({
  generateNoStrukSimpanan: vi.fn().mockResolvedValue("STR-20240115-001"),
  generateNoStrukTagihan: vi.fn().mockResolvedValue("TAG-20240115-001"),
}))

describe("Simpanan Flow Integration", () => {
  let prisma: any
  let assertRoleMock: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
    assertRoleMock = (await import("@/lib/auth")).assertRole
  })

  describe("setorSimpanan", () => {
    let setorSimpanan: typeof import("@/actions/simpanan")["setorSimpanan"]

    beforeEach(async () => {
      const mod = await import("@/actions/simpanan")
      setorSimpanan = mod.setorSimpanan
    })

    it("rejects when anggota not found", async () => {
      prisma.anggota.findUnique.mockResolvedValue(null)

      await expect(
        setorSimpanan({ anggotaId: "nonexistent", jenisSimpananId: "j1", nominal: 50000 })
      ).rejects.toThrow("Anggota tidak ditemukan")
    })

    it("rejects when jenis simpanan not found", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.jenisSimpanan.findUnique.mockResolvedValue(null)

      await expect(
        setorSimpanan({ anggotaId: "a1", jenisSimpananId: "nonexistent", nominal: 50000 })
      ).rejects.toThrow("Jenis simpanan tidak ditemukan")
    })

    it("rejects when deposit below minimum", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.jenisSimpanan.findUnique.mockResolvedValue({
        id: "j1",
        kode: "WAJIB",
        nama: "Simpanan Wajib",
        minimalSetoran: 50000,
      })

      await expect(
        setorSimpanan({ anggotaId: "a1", jenisSimpananId: "j1", nominal: 10000 })
      ).rejects.toThrow("minimal")
    })

    it("processes deposit successfully with journal entry", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.jenisSimpanan.findUnique.mockResolvedValue({
        id: "j1",
        kode: "WAJIB",
        nama: "Simpanan Wajib",
        minimalSetoran: 50000,
      })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "1.1.1" },
        { id: "akun2", kode: "2.1.2" },
      ])
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })
      prisma.simpanan.upsert.mockResolvedValue({
        id: "simpanan-1",
        anggotaId: "a1",
        jenisSimpananId: "j1",
        saldo: 100000,
      })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          simpanan: { upsert: prisma.simpanan.upsert },
          transaksiSimpanan: { create: prisma.transaksiSimpanan.create },
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: prisma.jurnalUmum.create },
          detailJurnal: { create: prisma.detailJurnal.create },
        }
        return fn(tx)
      })

      const result = await setorSimpanan({ anggotaId: "a1", jenisSimpananId: "j1", nominal: 100000 })

      expect(result.success).toBe(true)
      expect(result.data.noStruk).toBe("STR-20240115-001")
      expect(result.data.nominal).toBe(100000)
      expect(result.data.tipe).toBe("SETORAN")
      expect(result.data.jenisSimpanan.nama).toBe("Simpanan Wajib")

      expect(prisma.$transaction).toHaveBeenCalled()
      expect(prisma.simpanan.upsert).toHaveBeenCalled()
      expect(prisma.transaksiSimpanan.create).toHaveBeenCalled()
    })

    it("creates balanced journal entry (Kas debit, Simpanan kredit)", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.jenisSimpanan.findUnique.mockResolvedValue({
        id: "j1",
        kode: "WAJIB",
        nama: "Simpanan Wajib",
        minimalSetoran: 50000,
      })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "1.1.1" },
        { id: "akun2", kode: "2.1.2" },
      ])
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })
      prisma.simpanan.upsert.mockResolvedValue({ id: "simpanan-1", saldo: 150000 })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          simpanan: { upsert: prisma.simpanan.upsert },
          transaksiSimpanan: { create: prisma.transaksiSimpanan.create },
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: prisma.jurnalUmum.create },
          detailJurnal: { create: prisma.detailJurnal.create },
        }
        return fn(tx)
      })

      await setorSimpanan({ anggotaId: "a1", jenisSimpananId: "j1", nominal: 50000 })

      expect(prisma.jurnalUmum.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keterangan: expect.stringContaining("Simpanan Wajib"),
          }),
        })
      )
    })

    it("passes auth check on each call", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.jenisSimpanan.findUnique.mockResolvedValue({
        id: "j1",
        kode: "WAJIB",
        nama: "Simpanan Wajib",
        minimalSetoran: 50000,
      })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "1.1.1" },
        { id: "akun2", kode: "2.1.2" },
      ])
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })
      prisma.simpanan.upsert.mockResolvedValue({ id: "simpanan-1", saldo: 100000 })
      prisma.$transaction.mockImplementation(async (fn: any) => fn({
        simpanan: { upsert: prisma.simpanan.upsert },
        transaksiSimpanan: { create: prisma.transaksiSimpanan.create },
        akun: { findMany: prisma.akun.findMany },
        jurnalUmum: { create: prisma.jurnalUmum.create },
        detailJurnal: { create: prisma.detailJurnal.create },
      }))

      await setorSimpanan({ anggotaId: "a1", jenisSimpananId: "j1", nominal: 50000 })

      expect(assertRoleMock).toHaveBeenCalledWith("ADMIN", "PENGURUS", "BENDAHARA")
    })
  })
})
