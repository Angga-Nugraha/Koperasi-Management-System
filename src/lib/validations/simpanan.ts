import { z } from "zod"

export const setorSimpananSchema = z.object({
  anggotaId: z.string().min(1, "Anggota harus dipilih"),
  jenisSimpananId: z.string().min(1, "Jenis simpanan harus dipilih"),
  nominal: z.number().positive("Nominal harus lebih dari 0"),
  keterangan: z.string().nullable().optional(),
})

export const tarikSimpananSchema = z.object({
  anggotaId: z.string().min(1, "Anggota harus dipilih"),
  jenisSimpananId: z.string().min(1, "Jenis simpanan harus dipilih"),
  nominal: z.number().positive("Nominal harus lebih dari 0"),
  keterangan: z.string().nullable().optional(),
})

export const penutupanSimpananSchema = z.object({
  anggotaId: z.string().min(1, "Anggota harus dipilih"),
  keterangan: z.string().nullable().optional(),
})

export type SetorSimpananInput = z.infer<typeof setorSimpananSchema>
export type TarikSimpananInput = z.infer<typeof tarikSimpananSchema>
export type PenutupanSimpananInput = z.infer<typeof penutupanSimpananSchema>
