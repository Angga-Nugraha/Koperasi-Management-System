import { describe, it, expect } from "vitest"
import {
  anggotaSchema,
  anggotaStatusSchema,
  resetPasswordSchema as anggotaResetPasswordSchema,
} from "@/lib/validations/anggota"
import {
  setorSimpananSchema,
  tarikSimpananSchema,
  getTagihanListSchema,
  generateTagihanSchema,
  bayarTagihanSchema,
} from "@/lib/validations/simpanan"
import {
  ajukanPinjamanSchema,
  cairkanPinjamanSchema,
  bayarAngsuranSchema,
  hapusPinjamanSchema,
  setujuiPinjamanSchema,
  bayarAngsuranKeSchema,
} from "@/lib/validations/pinjaman"
import { jurnalManualSchema } from "@/lib/validations/jurnal"
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema as userResetPasswordSchema,
} from "@/lib/validations/user"
import { jabatanSchema, kepengurusanSchema } from "@/lib/validations/kepengurusan"

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

  describe("resetPasswordSchema (anggota)", () => {
    it("accepts valid password", () => {
      expect(
        anggotaResetPasswordSchema.safeParse({ userId: "abc", password: "secret123" }).success,
      ).toBe(true)
    })

    it("rejects short password", () => {
      expect(
        anggotaResetPasswordSchema.safeParse({ userId: "abc", password: "12345" }).success,
      ).toBe(false)
    })
  })

  describe("setorSimpananSchema", () => {
    it("accepts valid deposit", () => {
      expect(
        setorSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 50000 })
          .success,
      ).toBe(true)
    })

    it("rejects zero nominal", () => {
      expect(
        setorSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 0 }).success,
      ).toBe(false)
    })

    it("rejects negative nominal", () => {
      expect(
        setorSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: -100 })
          .success,
      ).toBe(false)
    })

    it("rejects empty anggotaId", () => {
      expect(
        setorSimpananSchema.safeParse({ anggotaId: "", jenisSimpananId: "b", nominal: 50000 })
          .success,
      ).toBe(false)
    })
  })

  describe("tarikSimpananSchema", () => {
    it("accepts valid withdrawal", () => {
      expect(
        tarikSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 25000 })
          .success,
      ).toBe(true)
    })

    it("rejects zero nominal", () => {
      expect(
        tarikSimpananSchema.safeParse({ anggotaId: "a", jenisSimpananId: "b", nominal: 0 }).success,
      ).toBe(false)
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
      expect(
        ajukanPinjamanSchema.safeParse({
          anggotaId: "a",
          jenisPinjamanId: "b",
          jumlah: 1000000,
          tenor: 12,
        }).success,
      ).toBe(true)
    })

    it("rejects zero tenor", () => {
      expect(
        ajukanPinjamanSchema.safeParse({
          anggotaId: "a",
          jenisPinjamanId: "b",
          jumlah: 1000000,
          tenor: 0,
        }).success,
      ).toBe(false)
    })

    it("rejects zero jumlah", () => {
      expect(
        ajukanPinjamanSchema.safeParse({
          anggotaId: "a",
          jenisPinjamanId: "b",
          jumlah: 0,
          tenor: 12,
        }).success,
      ).toBe(false)
    })

    it("accepts optional keterangan", () => {
      const result = ajukanPinjamanSchema.safeParse({
        anggotaId: "a",
        jenisPinjamanId: "b",
        jumlah: 1000000,
        tenor: 12,
        keterangan: "Test",
      })
      expect(result.success).toBe(true)
    })

    it("accepts null keterangan", () => {
      const result = ajukanPinjamanSchema.safeParse({
        anggotaId: "a",
        jenisPinjamanId: "b",
        jumlah: 1000000,
        tenor: 12,
        keterangan: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe("setujuiPinjamanSchema", () => {
    it("accepts valid input", () => {
      expect(setujuiPinjamanSchema.safeParse({ pinjamanId: "abc" }).success).toBe(true)
    })

    it("accepts with keterangan", () => {
      expect(
        setujuiPinjamanSchema.safeParse({ pinjamanId: "abc", keterangan: "Disetujui" }).success,
      ).toBe(true)
    })

    it("rejects empty pinjamanId", () => {
      expect(setujuiPinjamanSchema.safeParse({ pinjamanId: "" }).success).toBe(false)
    })
  })

  describe("cairkanPinjamanSchema", () => {
    it("accepts valid input", () => {
      expect(cairkanPinjamanSchema.safeParse({ pinjamanId: "abc" }).success).toBe(true)
    })

    it("rejects empty pinjamanId", () => {
      expect(cairkanPinjamanSchema.safeParse({ pinjamanId: "" }).success).toBe(false)
    })
  })

  describe("bayarAngsuranSchema", () => {
    it("accepts valid payment", () => {
      expect(bayarAngsuranSchema.safeParse({ pinjamanId: "abc", nominal: 500000 }).success).toBe(
        true,
      )
    })

    it("rejects zero nominal", () => {
      expect(bayarAngsuranSchema.safeParse({ pinjamanId: "abc", nominal: 0 }).success).toBe(false)
    })

    it("rejects negative nominal", () => {
      expect(bayarAngsuranSchema.safeParse({ pinjamanId: "abc", nominal: -100 }).success).toBe(
        false,
      )
    })
  })

  describe("bayarAngsuranKeSchema", () => {
    it("accepts valid input", () => {
      expect(bayarAngsuranKeSchema.safeParse({ pinjamanId: "abc", angsuranKe: 3 }).success).toBe(
        true,
      )
    })

    it("rejects zero angsuranKe", () => {
      expect(bayarAngsuranKeSchema.safeParse({ pinjamanId: "abc", angsuranKe: 0 }).success).toBe(
        false,
      )
    })

    it("rejects negative angsuranKe", () => {
      expect(bayarAngsuranKeSchema.safeParse({ pinjamanId: "abc", angsuranKe: -1 }).success).toBe(
        false,
      )
    })
  })

  describe("hapusPinjamanSchema", () => {
    it("accepts valid input", () => {
      expect(hapusPinjamanSchema.safeParse({ pinjamanId: "abc" }).success).toBe(true)
    })

    it("rejects empty pinjamanId", () => {
      expect(hapusPinjamanSchema.safeParse({ pinjamanId: "" }).success).toBe(false)
    })
  })

  describe("jurnalManualSchema", () => {
    const validEntry = {
      tanggal: "2024-01-15",
      keterangan: "Test jurnal",
      entries: [
        { akunId: "akun1", debit: 50000, kredit: 0 },
        { akunId: "akun2", debit: 0, kredit: 50000 },
      ],
    }

    it("accepts valid jurnal", () => {
      expect(jurnalManualSchema.safeParse(validEntry).success).toBe(true)
    })

    it("rejects jurnal with single entry", () => {
      const result = jurnalManualSchema.safeParse({
        ...validEntry,
        entries: [{ akunId: "akun1", debit: 50000, kredit: 50000 }],
      })
      expect(result.success).toBe(false)
    })

    it("rejects unbalanced entries (debit > kredit)", () => {
      const result = jurnalManualSchema.safeParse({
        ...validEntry,
        entries: [
          { akunId: "akun1", debit: 100000, kredit: 0 },
          { akunId: "akun2", debit: 0, kredit: 50000 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("rejects unbalanced entries (kredit > debit)", () => {
      const result = jurnalManualSchema.safeParse({
        ...validEntry,
        entries: [
          { akunId: "akun1", debit: 30000, kredit: 0 },
          { akunId: "akun2", debit: 0, kredit: 60000 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("rejects empty keterangan", () => {
      const result = jurnalManualSchema.safeParse({ ...validEntry, keterangan: "" })
      expect(result.success).toBe(false)
    })

    it("rejects empty tanggal", () => {
      const result = jurnalManualSchema.safeParse({ ...validEntry, tanggal: "" })
      expect(result.success).toBe(false)
    })

    it("rejects negative debit", () => {
      const result = jurnalManualSchema.safeParse({
        ...validEntry,
        entries: [
          { akunId: "akun1", debit: -100, kredit: 0 },
          { akunId: "akun2", debit: 0, kredit: 50000 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("accepts multiple entries that balance", () => {
      const result = jurnalManualSchema.safeParse({
        ...validEntry,
        entries: [
          { akunId: "akun1", debit: 100000, kredit: 0 },
          { akunId: "akun2", debit: 0, kredit: 60000 },
          { akunId: "akun3", debit: 0, kredit: 40000 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it("accepts zero entries (when balanced)", () => {
      const result = jurnalManualSchema.safeParse({
        ...validEntry,
        entries: [
          { akunId: "akun1", debit: 0, kredit: 50000 },
          { akunId: "akun2", debit: 50000, kredit: 0 },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe("createUserSchema", () => {
    it("accepts valid user creation", () => {
      const result = createUserSchema.safeParse({
        email: "test@mail.com",
        password: "secret123",
        confirmPassword: "secret123",
        role: "ADMIN",
      })
      expect(result.success).toBe(true)
    })

    it("rejects mismatched passwords", () => {
      const result = createUserSchema.safeParse({
        email: "test@mail.com",
        password: "secret123",
        confirmPassword: "different",
        role: "ADMIN",
      })
      expect(result.success).toBe(false)
    })

    it("rejects invalid email", () => {
      const result = createUserSchema.safeParse({
        email: "invalid",
        password: "secret123",
        confirmPassword: "secret123",
        role: "ADMIN",
      })
      expect(result.success).toBe(false)
    })

    it("rejects short password", () => {
      const result = createUserSchema.safeParse({
        email: "test@mail.com",
        password: "12345",
        confirmPassword: "12345",
        role: "ADMIN",
      })
      expect(result.success).toBe(false)
    })

    it("accepts all valid roles", () => {
      for (const role of ["ADMIN", "PENGURUS", "BENDAHARA", "PENGAWAS", "ANGGOTA"]) {
        const result = createUserSchema.safeParse({
          email: "test@mail.com",
          password: "secret123",
          confirmPassword: "secret123",
          role,
        })
        expect(result.success).toBe(true)
      }
    })

    it("rejects invalid role", () => {
      const result = createUserSchema.safeParse({
        email: "test@mail.com",
        password: "secret123",
        confirmPassword: "secret123",
        role: "INVALID",
      })
      expect(result.success).toBe(false)
    })

    it("accepts optional anggotaId", () => {
      const result = createUserSchema.safeParse({
        email: "test@mail.com",
        password: "secret123",
        confirmPassword: "secret123",
        role: "ANGGOTA",
        anggotaId: "abc-123",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("updateUserSchema", () => {
    it("accepts valid user update", () => {
      const result = updateUserSchema.safeParse({
        id: "abc",
        email: "test@mail.com",
        role: "ADMIN",
        isActive: true,
      })
      expect(result.success).toBe(true)
    })

    it("rejects invalid email", () => {
      const result = updateUserSchema.safeParse({
        id: "abc",
        email: "invalid",
        role: "ADMIN",
        isActive: true,
      })
      expect(result.success).toBe(false)
    })

    it("accepts isActive false", () => {
      const result = updateUserSchema.safeParse({
        id: "abc",
        email: "test@mail.com",
        role: "ADMIN",
        isActive: false,
      })
      expect(result.success).toBe(true)
    })
  })

  describe("user resetPasswordSchema", () => {
    it("accepts matching passwords", () => {
      const result = userResetPasswordSchema.safeParse({
        userId: "abc",
        password: "secret123",
        confirmPassword: "secret123",
      })
      expect(result.success).toBe(true)
    })

    it("rejects mismatched passwords", () => {
      const result = userResetPasswordSchema.safeParse({
        userId: "abc",
        password: "secret123",
        confirmPassword: "different",
      })
      expect(result.success).toBe(false)
    })

    it("rejects short password", () => {
      const result = userResetPasswordSchema.safeParse({
        userId: "abc",
        password: "12345",
        confirmPassword: "12345",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("jabatanSchema", () => {
    it("accepts valid jabatan", () => {
      expect(jabatanSchema.safeParse({ jabatan: "Ketua", tipe: "PENGURUS" }).success).toBe(true)
    })

    it("accepts PENGAWAS tipe", () => {
      expect(
        jabatanSchema.safeParse({ jabatan: "Anggota Pengawas", tipe: "PENGAWAS" }).success,
      ).toBe(true)
    })

    it("rejects short jabatan name", () => {
      expect(jabatanSchema.safeParse({ jabatan: "A", tipe: "PENGURUS" }).success).toBe(false)
    })

    it("rejects invalid tipe", () => {
      expect(jabatanSchema.safeParse({ jabatan: "Ketua", tipe: "INVALID" }).success).toBe(false)
    })
  })

  describe("kepengurusanSchema", () => {
    it("accepts valid assignment", () => {
      expect(kepengurusanSchema.safeParse({ jabatan: "Ketua", anggotaId: "abc-123" }).success).toBe(
        true,
      )
    })

    it("rejects empty jabatan", () => {
      expect(kepengurusanSchema.safeParse({ jabatan: "", anggotaId: "abc-123" }).success).toBe(
        false,
      )
    })

    it("rejects empty anggotaId", () => {
      expect(kepengurusanSchema.safeParse({ jabatan: "Ketua", anggotaId: "" }).success).toBe(false)
    })
  })
})
