import { z } from "zod"

export const jabatanSchema = z.object({
  jabatan: z.string().min(2, "Nama jabatan minimal 2 karakter").max(100),
  tipe: z.enum(["PENGURUS", "PENGAWAS"]),
})

export const kepengurusanSchema = z.object({
  jabatan: z.string().min(1, "Jabatan wajib diisi"),
  anggotaId: z.string().min(1, "Anggota wajib dipilih"),
})
