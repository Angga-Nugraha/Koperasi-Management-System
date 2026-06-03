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

export const generateTagihanSchema = z.object({
  bulan: z.number().int().min(1).max(12).optional(),
  tahun: z.number().int().min(2020).max(2100).optional(),
})

export const getTagihanListSchema = z.object({
  bulan: z.number().int().min(1).max(12).optional(),
  tahun: z.number().int().min(2020).max(2100).optional(),
  status: z.string().optional(),
  jenis: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
})

export const bayarTagihanSchema = z.object({
  tagihanId: z.string().min(1),
})

export type SetorSimpananInput = z.infer<typeof setorSimpananSchema>
export type TarikSimpananInput = z.infer<typeof tarikSimpananSchema>
export type PenutupanSimpananInput = z.infer<typeof penutupanSimpananSchema>
export type GenerateTagihanInput = z.infer<typeof generateTagihanSchema>
export type GetTagihanListInput = z.infer<typeof getTagihanListSchema>
export type BayarTagihanInput = z.infer<typeof bayarTagihanSchema>
