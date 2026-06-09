import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    anggota: { findUnique: vi.fn() },
    pinjaman: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    jenisPinjaman: { findUnique: vi.fn() },
    simpanan: { aggregate: vi.fn() },
    user: { findUnique: vi.fn() },
    angsuran: { createMany: vi.fn() },
    akun: { findMany: vi.fn() },
    jurnalUmum: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn().mockResolvedValue({ user: { id: "petugas-1", email: "admin@test.com" } }),
  auth: vi.fn().mockResolvedValue({ user: { id: "petugas-1" } }),
}))

vi.mock("@/lib/konfig", () => ({
  getKonfig: vi.fn().mockResolvedValue({
    tenor_min: "3",
    tenor_max: "36",
    plafon_max_saldo: "5",
    denda_per_hari: "0.5",
    grace_period: "7",
  }),
  getNumber: vi.fn((_konfig: any, key: string, fallback: number) => {
    const map: Record<string, number> = {
      tenor_min: 3,
      tenor_max: 36,
      plafon_max_saldo: 5,
      denda_per_hari: 0.5,
      grace_period: 7,
    }
    return map[key] ?? fallback
  }),
}))

vi.mock("@/lib/audit", () => ({
  catatLog: vi.fn(),
}))

vi.mock("@/lib/notifikasi", () => ({
  notifyAdmins: vi.fn(),
  notifyMember: vi.fn(),
  kirimNotifikasi: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/struk", () => ({
  generateNoStrukAngsuran: vi.fn().mockResolvedValue("STR-20240115-001"),
}))

describe("Pinjaman Flow Integration", () => {
  let prisma: any
  let assertRoleMock: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
    assertRoleMock = (await import("@/lib/auth")).assertRole
  })

  describe("ajukanPinjaman", () => {
    let ajukanPinjaman: (typeof import("@/actions/pinjaman"))["ajukanPinjaman"]

    beforeEach(async () => {
      const mod = await import("@/actions/pinjaman")
      ajukanPinjaman = mod.ajukanPinjaman
    })

    it("rejects with invalid input (zero jumlah)", async () => {
      await expect(
        ajukanPinjaman({ anggotaId: "a1", jenisPinjamanId: "j1", jumlah: 0, tenor: 12 }),
      ).rejects.toThrow()
    })

    it("rejects when anggota not found", async () => {
      prisma.anggota.findUnique.mockResolvedValue(null)

      await expect(
        ajukanPinjaman({
          anggotaId: "nonexistent",
          jenisPinjamanId: "j1",
          jumlah: 1000000,
          tenor: 12,
        }),
      ).rejects.toThrow("Anggota tidak ditemukan")
    })

    it("rejects when anggota has active loan", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi" })
      prisma.pinjaman.findFirst.mockResolvedValue({ id: "existing", status: "DICAIRKAN" })

      await expect(
        ajukanPinjaman({ anggotaId: "a1", jenisPinjamanId: "j1", jumlah: 1000000, tenor: 12 }),
      ).rejects.toThrow("pinjaman aktif")
    })

    it("rejects when jenis pinjaman not found", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi" })
      prisma.pinjaman.findFirst.mockResolvedValue(null)
      prisma.jenisPinjaman.findUnique.mockResolvedValue(null)

      await expect(
        ajukanPinjaman({ anggotaId: "a1", jenisPinjamanId: "j1", jumlah: 1000000, tenor: 12 }),
      ).rejects.toThrow("Jenis pinjaman tidak ditemukan")
    })

    it("rejects loan exceeding plafon", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi" })
      prisma.pinjaman.findFirst.mockResolvedValue(null)
      prisma.jenisPinjaman.findUnique.mockResolvedValue({ id: "j1", nama: "Reguler", bunga: "1.5" })
      prisma.simpanan.aggregate.mockResolvedValue({ _sum: { saldo: 100000 } })

      await expect(
        ajukanPinjaman({ anggotaId: "a1", jenisPinjamanId: "j1", jumlah: 1000000, tenor: 12 }),
      ).rejects.toThrow("melebihi plafon")
    })

    it("creates loan successfully with correct angsuran calculation", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi", noAnggota: "001" })
      prisma.pinjaman.findFirst.mockResolvedValue(null)
      prisma.jenisPinjaman.findUnique.mockResolvedValue({ id: "j1", nama: "Reguler", bunga: "1.5" })
      prisma.simpanan.aggregate.mockResolvedValue({ _sum: { saldo: 1000000 } })
      prisma.pinjaman.create.mockResolvedValue({
        id: "pinjaman-1",
        anggotaId: "a1",
        jumlah: 5000000,
        tenor: 12,
        status: "PENGAJUAN",
      })

      const result = await ajukanPinjaman({
        anggotaId: "a1",
        jenisPinjamanId: "j1",
        jumlah: 5000000,
        tenor: 12,
      })

      expect(result.success).toBe(true)
      expect(prisma.pinjaman.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            anggotaId: "a1",
            jumlah: 5000000,
            tenor: 12,
            angsuranPokok: 416666.67,
            angsuranJasa: 75000,
            angsuranTotal: 491666.67,
            status: "PENGAJUAN",
          }),
        }),
      )
    })

    it("passes auth check with correct role", async () => {
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi" })
      prisma.pinjaman.findFirst.mockResolvedValue(null)
      prisma.jenisPinjaman.findUnique.mockResolvedValue({ id: "j1", nama: "Reguler", bunga: "1.5" })
      prisma.simpanan.aggregate.mockResolvedValue({ _sum: { saldo: 1000000 } })
      prisma.pinjaman.create.mockResolvedValue({ id: "pinjaman-1" })

      await ajukanPinjaman({ anggotaId: "a1", jenisPinjamanId: "j1", jumlah: 1000000, tenor: 12 })

      expect(assertRoleMock).toHaveBeenCalledWith("ADMIN", "PENGURUS", "BENDAHARA")
    })
  })

  describe("setujuiPinjaman", () => {
    let setujuiPinjaman: (typeof import("@/actions/pinjaman"))["setujuiPinjaman"]

    beforeEach(async () => {
      const mod = await import("@/actions/pinjaman")
      setujuiPinjaman = mod.setujuiPinjaman
    })

    it("rejects when pinjaman not found", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue(null)

      await expect(setujuiPinjaman({ pinjamanId: "nonexistent" })).rejects.toThrow(
        "Pinjaman tidak ditemukan",
      )
    })

    it("rejects when pinjaman status is not PENGAJUAN", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({ id: "p1", status: "DICAIRKAN" })

      await expect(setujuiPinjaman({ pinjamanId: "p1" })).rejects.toThrow("Pinjaman sudah diproses")
    })

    it("approves loan successfully", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "PENGAJUAN",
        jumlah: 5000000,
        anggotaId: "a1",
        keterangan: null,
      })
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await setujuiPinjaman({ pinjamanId: "p1" })

      expect(result.success).toBe(true)
      expect(prisma.pinjaman.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "p1" },
          data: expect.objectContaining({ status: "DISETUJUI" }),
        }),
      )
    })

    it("includes approval notes in keterangan", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "PENGAJUAN",
        jumlah: 5000000,
        anggotaId: "a1",
        keterangan: "Catatan awal",
      })
      prisma.user.findUnique.mockResolvedValue(null)

      await setujuiPinjaman({ pinjamanId: "p1", keterangan: "Layak diberikan" })

      expect(prisma.pinjaman.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            keterangan: expect.stringContaining("Catatan awal"),
          }),
        }),
      )
    })
  })

  describe("cairkanPinjaman", () => {
    let cairkanPinjaman: (typeof import("@/actions/pinjaman"))["cairkanPinjaman"]

    beforeEach(async () => {
      const mod = await import("@/actions/pinjaman")
      cairkanPinjaman = mod.cairkanPinjaman
    })

    it("rejects when pinjaman not found", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue(null)

      await expect(cairkanPinjaman({ pinjamanId: "nonexistent" })).rejects.toThrow(
        "Pinjaman tidak ditemukan",
      )
    })

    it("rejects when pinjaman is not yet approved", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "PENGAJUAN",
        anggota: { noAnggota: "001", nama: "Budi" },
      })

      await expect(cairkanPinjaman({ pinjamanId: "p1" })).rejects.toThrow("harus disetujui")
    })

    it("disburses loan and creates installment schedule", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "DISETUJUI",
        jumlah: 5000000,
        tenor: 12,
        angsuranPokok: 416666.67,
        angsuranJasa: 75000,
        sisaPinjaman: 0,
        anggotaId: "a1",
        anggota: { noAnggota: "001", nama: "Budi" },
      })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "1.2.1" },
        { id: "akun2", kode: "1.1.1" },
      ])
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          pinjaman: { update: vi.fn() },
          angsuran: { createMany: vi.fn() },
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: prisma.jurnalUmum.create },
        }
        return fn(tx)
      })
      prisma.user.findUnique.mockResolvedValue(null)

      const result = await cairkanPinjaman({ pinjamanId: "p1" })

      expect(result.success).toBe(true)
      expect(prisma.$transaction).toHaveBeenCalled()
    })
  })

  describe("bayarAngsuran", () => {
    let bayarAngsuran: (typeof import("@/actions/pinjaman"))["bayarAngsuran"]

    beforeEach(async () => {
      const mod = await import("@/actions/pinjaman")
      bayarAngsuran = mod.bayarAngsuran
    })

    it("rejects when pinjaman already lunas", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "LUNAS",
        anggota: { noAnggota: "001", nama: "Budi" },
      })

      await expect(bayarAngsuran({ pinjamanId: "p1", nominal: 500000 })).rejects.toThrow(
        "Pinjaman sudah lunas",
      )
    })

    it("rejects when no unpaid installments exist", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "DICAIRKAN",
        sisaPinjaman: 0,
        anggota: { noAnggota: "001", nama: "Budi" },
        angsuran: [],
      })

      await expect(bayarAngsuran({ pinjamanId: "p1", nominal: 500000 })).rejects.toThrow(
        "Semua angsuran sudah lunas",
      )
    })

    it("rejects payment less than total due", async () => {
      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "DICAIRKAN",
        sisaPinjaman: 5000000,
        anggota: { noAnggota: "001", nama: "Budi" },
        angsuran: [
          {
            id: "angs-1",
            angsuranKe: 1,
            pokok: 416666.67,
            jasa: 75000,
            denda: 0,
            total: 491666.67,
            status: "BELUM_LUNAS",
            jatuhTempo: new Date("2024-02-15"),
          },
        ],
      })
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })

      await expect(bayarAngsuran({ pinjamanId: "p1", nominal: 100000 })).rejects.toThrow(
        "Pembayaran kurang",
      )
    })

    it("processes payment successfully for first angsuran", async () => {
      const angsuranList = Array.from({ length: 12 }, (_, i) => ({
        id: `angs-${i + 1}`,
        angsuranKe: i + 1,
        pokok: 416666.67,
        jasa: 75000,
        denda: 0,
        total: 491666.67,
        status: "BELUM_LUNAS" as const,
        jatuhTempo: new Date("2099-01-15"),
      }))

      prisma.pinjaman.findUnique.mockResolvedValue({
        id: "p1",
        status: "DICAIRKAN",
        sisaPinjaman: 5000000,
        jumlah: 5000000,
        anggotaId: "a1",
        anggota: { noAnggota: "001", nama: "Budi" },
        angsuran: angsuranList,
      })
      prisma.akun.findMany.mockResolvedValue([
        { id: "akun1", kode: "1.1.1" },
        { id: "akun2", kode: "1.2.1" },
        { id: "akun3", kode: "4.1.1" },
      ])
      prisma.jurnalUmum.create.mockResolvedValue({ id: "jurnal-1" })
      prisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          angsuran: { update: vi.fn() },
          pinjaman: { update: vi.fn() },
          akun: { findMany: prisma.akun.findMany },
          jurnalUmum: { create: prisma.jurnalUmum.create },
        }
        return fn(tx)
      })

      const result = await bayarAngsuran({ pinjamanId: "p1", nominal: 491666.67 })

      expect(result).toEqual({ success: true })
    })
  })
})
