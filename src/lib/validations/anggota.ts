import { z } from "zod"

export const anggotaSchema = z.object({
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^\d{16}$/, "NIK hanya boleh angka"),
  nama: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  alamat: z.string().min(10, "Alamat minimal 10 karakter"),
  pekerjaan: z.string().max(100, "Pekerjaan maksimal 100 karakter").optional().or(z.literal("")),
  penghasilan: z.number().min(0, "Penghasilan tidak boleh negatif").optional().nullable(),
  foto: z.string().optional().nullable(),
  ktp: z.string().optional().nullable(),
  tglMasuk: z.string().min(1, "Tanggal masuk wajib diisi"),
  buatUser: z.boolean().optional().default(false),
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  password: z.string().min(6, "Password minimal 6 karakter").optional().or(z.literal("")),
})

export const anggotaUpdateSchema = anggotaSchema.extend({
  id: z.string(),
})

export const anggotaStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["AKTIF", "NONAKTIF", "KELUAR"]),
})

export const resetPasswordSchema = z.object({
  userId: z.string(),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export type AnggotaInput = z.infer<typeof anggotaSchema>
