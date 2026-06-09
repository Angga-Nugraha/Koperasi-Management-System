/**
 * @file src/lib/__tests__/shu-validation.test.ts
 * @description Unit test untuk menguji fungsionalitas shu-validation.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  assertRole: vi.fn(),
}))

// Mock prisma for saveIndikatorSHU
vi.mock("@/lib/prisma", () => ({
  prisma: {
    indikatorSHU: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    alokasiSHU: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (cb: (tx: any) => Promise<void>) => {
      await cb({
        indikatorSHU: {
          upsert: vi.fn(),
          deleteMany: vi.fn(),
        },
        alokasiSHU: {
          deleteMany: vi.fn(),
        },
      })
    }),
  },
}))

describe("SHU Business Logic", () => {
  describe("saveIndikatorSHU - total percentage validation", () => {
    let saveIndikatorSHU: (typeof import("@/lib/shu"))["saveIndikatorSHU"]

    beforeEach(async () => {
      const mod = await import("@/lib/shu")
      saveIndikatorSHU = mod.saveIndikatorSHU
    })

    it("accepts items totalling exactly 100%", async () => {
      const items = [
        {
          kode: "JM",
          nama: "Jasa Modal",
          persentase: 20,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 1,
        },
        {
          kode: "JU",
          nama: "Jasa Usaha",
          persentase: 30,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 2,
        },
        {
          kode: "CAD",
          nama: "Cadangan",
          persentase: 40,
          kelompok: "DANA",
          akunId: null,
          urutan: 3,
        },
        {
          kode: "SOSIAL",
          nama: "Sosial",
          persentase: 10,
          kelompok: "DANA",
          akunId: null,
          urutan: 4,
        },
      ]
      await expect(saveIndikatorSHU(items)).resolves.not.toThrow()
    })

    it("rejects items totalling less than 100%", async () => {
      const items = [
        {
          kode: "JM",
          nama: "Jasa Modal",
          persentase: 20,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 1,
        },
        {
          kode: "JU",
          nama: "Jasa Usaha",
          persentase: 30,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 2,
        },
      ]
      await expect(saveIndikatorSHU(items)).rejects.toThrow("Total persentase harus 100%")
    })

    it("rejects items totalling more than 100%", async () => {
      const items = [
        {
          kode: "JM",
          nama: "Jasa Modal",
          persentase: 60,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 1,
        },
        {
          kode: "JU",
          nama: "Jasa Usaha",
          persentase: 50,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 2,
        },
      ]
      await expect(saveIndikatorSHU(items)).rejects.toThrow("Total persentase harus 100%")
    })

    it("accepts percentages with floating point that sum to 100", async () => {
      const items = [
        {
          kode: "JM",
          nama: "Jasa Modal",
          persentase: 33.33,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 1,
        },
        {
          kode: "JU",
          nama: "Jasa Usaha",
          persentase: 33.33,
          kelompok: "ANGGOTA",
          akunId: null,
          urutan: 2,
        },
        {
          kode: "CAD",
          nama: "Cadangan",
          persentase: 33.34,
          kelompok: "DANA",
          akunId: null,
          urutan: 3,
        },
      ]
      await expect(saveIndikatorSHU(items)).resolves.not.toThrow()
    })
  })
})
