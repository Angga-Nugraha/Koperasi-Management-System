/**
 * @file src/lib/__tests__/validations.test.ts
 * @description Unit test untuk menguji fungsionalitas validations.
 */

import { describe, it, expect } from "vitest"
import { anggotaSchema, anggotaStatusSchema, resetPasswordSchema } from "@/lib/validations/anggota"
import { setorSimpananSchema, tarikSimpananSchema, getTagihanListSchema, generateTagihanSchema, bayarTagihanSchema } from "@/lib/validations/simpanan"
import { ajukanPinjamanSchema, cairkanPinjamanSchema, bayarAngsuranSchema, hapusPinjamanSchema } from "@/lib/validations/pinjaman"

describe("Validation Schemas", () => {
  describe("anggotaSchema", () => {
    const validData = {
      nik: "1234567890123456",
      nama: "John Doe",
      alamat: "Jl. Merdeka No. 1, Jakarta",
      tglMasuk: "2024-01-15",
    }

    it("passes with valid data", () => {
      const result = anggotaSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects NIK shorter than 16 digits", () => {
      const result = anggotaSchema.safeParse({ ...validData, nik: "12345" })
      expect(result.success).toBe(false)
    })

    it("rejects NIK with non-numeric characters", () => {
      const result = anggotaSchema.safeParse({ ...validData, nik: "123456789012345a" })
      expect(result.success).toBe(false)
    })

    it("rejects nama shorter than 3 characters", () => {
      const result = anggotaSchema.safeParse({ ...validData, nama: "AB" })
      expect(result.success).toBe(false)
    })

    it("accepts optional fields", () => {
      const result = anggotaSchema.safeParse({
        ...validData,
        noHp: "08123456789",
        pekerjaan: "Swasta",
        penghasilan: 5000000,
      })
      expect(result.success).toBe(true)
    })

    it("accepts empty optional fields", () => {
      const result = anggotaSchema.safeParse({ ...validData, noHp: "", email: "" })
      expect(result.success).toBe(true)
    })

    it("rejects negative penghasilan", () => {
      const result = anggotaSchema.safeParse({ ...validData, penghasilan: -100 })
      expect(result.success).toBe(false)
    })
  })

  describe("anggotaStatusSchema", () => {
    it("accepts AKTIF status", () => {
      expect(anggotaStatusSchema.safeParse({ id: "abc", status: "AKTIF" }).success).toBe(true)
    })

    it("accepts NONAKTIF status", () => {
      expect(anggotaStatusSchema.safeParse({ id: "abc", status: "NONAKTIF" }).success).toBe(true)
    })

    it("accepts KELUAR status", () => {
      expect(anggotaStatusSchema.safeParse({ id: "abc", status: "KELUAR" }).success).toBe(true)
    })

    it("rejects invalid status", () => {
      expect(anggotaStatusSchema.safeParse({ id: "abc", status: "INVALID" }).success).toBe(false)
    })

    it("passes with empty id (schema allows it)", () => {
      expect(anggotaStatusSchema.safeParse({ id: "", status: "AKTIF" }).success).toBe(true)
    })
  })

  describe("resetPasswordSchema", () => {
    it("accepts valid password", () => {
      expect(resetPasswordSchema.safeParse({ userId: "abc", password: "secret123" }).success).toBe(true)
    })

    it("rejects short password", () => {
      expect(resetPasswordSchema.safeParse({ userId: "abc", password: "12345" }).success).toBe(false)
    })
  })

  describe("setorSimpananSchema", () => {
    it("accepts valid deposit", () => {
      expect(setorSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 50000 }).success).toBe(true)
    })

    it("rejects zero nominal", () => {
      expect(setorSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 0 }).success).toBe(false)
    })

    it("rejects negative nominal", () => {
      expect(setorSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: -100 }).success).toBe(false)
    })

    it("rejects empty anggotaId", () => {
      expect(setorSimpananSchema.safeParse({ anggotaId: "", jenisSimpananId: "b", nominal: 50000 }).success).toBe(false)
    })
  })

  describe("tarikSimpananSchema", () => {
    it("accepts valid withdrawal", () => {
      expect(tarikSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 25000 }).success).toBe(true)
    })
  })

  describe("getTagihanListSchema", () => {
    it("uses defaults for page and pageSize", () => {
      const result = getTagihanListSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it("accepts valid month and year", () => {
      const result = getTagihanListSchema.safeParse({ bulan: 6, tahun: 2024 })
      expect(result.success).toBe(true)
    })

    it("rejects month > 12", () => {
      expect(getTagihanListSchema.safeParse({ bulan: 13 }).success).toBe(false)
    })

    it("rejects month < 1", () => {
      expect(getTagihanListSchema.safeParse({ bulan: 0 }).success).toBe(false)
    })
  })

  describe("generateTagihanSchema", () => {
    it("accepts valid input", () => {
      expect(generateTagihanSchema.safeParse({ bulan: 6, tahun: 2024 }).success).toBe(true)
    })

    it("accepts empty input", () => {
      expect(generateTagihanSchema.safeParse({}).success).toBe(true)
    })
  })

  describe("bayarTagihanSchema", () => {
    it("accepts valid tagihanId", () => {
      expect(bayarTagihanSchema.safeParse({ tagihanId: "abc-123" }).success).toBe(true)
    })

    it("rejects empty tagihanId", () => {
      expect(bayarTagihanSchema.safeParse({ tagihanId: "" }).success).toBe(false)
    })
  })

  describe("ajukanPinjamanSchema", () => {
    it("accepts valid loan application", () => {
      expect(ajukanPinjamanSchema.safeParse({
        anggotaId: "a", jenisPinjamanId: "b", jumlah: 1000000, tenor: 12,
      }).success).toBe(true)
    })

    it("rejects zero tenor", () => {
      expect(ajukanPinjamanSchema.safeParse({
        anggotaId: "a", jenisPinjamanId: "b", jumlah: 1000000, tenor: 0,
      }).success).toBe(false)
    })

    it("rejects zero jumlah", () => {
      expect(ajukanPinjamanSchema.safeParse({
        anggotaId: "a", jenisPinjamanId: "b", jumlah: 0, tenor: 12,
      }).success).toBe(false)
    })
  })

  describe("cairkanPinjamanSchema", () => {
    it("accepts valid input", () => {
      expect(cairkanPinjamanSchema.safeParse({ pinjamanId: "abc" }).success).toBe(true)
    })
  })

  describe("bayarAngsuranSchema", () => {
    it("accepts valid payment", () => {
      expect(bayarAngsuranSchema.safeParse({ pinjamanId: "abc", nominal: 500000 }).success).toBe(true)
    })

    it("rejects zero nominal", () => {
      expect(bayarAngsuranSchema.safeParse({ pinjamanId: "abc", nominal: 0 }).success).toBe(false)
    })
  })

  describe("hapusPinjamanSchema", () => {
    it("accepts valid input", () => {
      expect(hapusPinjamanSchema.safeParse({ pinjamanId: "abc" }).success).toBe(true)
    })
  })
})
