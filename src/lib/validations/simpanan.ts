import { z } from "zod"

export const setorSimpananSchema = z.object({
  anggotaId: z.string().min(1, "Anggota wajib dipilih"),
  jenis: z.enum(["POKOK", "WAJIB", "SUKARELA"]),
  nominal: z.number().positive("Nominal harus lebih dari 0"),
  keterangan: z.string().optional().nullable(),
})

export const tarikSimpananSchema = z.object({
  anggotaId: z.string().min(1, "Anggota wajib dipilih"),
  jenis: z.enum(["POKOK", "WAJIB", "SUKARELA"]),
  nominal: z.number().positive("Nominal harus lebih dari 0"),
  keterangan: z.string().optional().nullable(),
})

export type SetorSimpananInput = z.infer<typeof setorSimpananSchema>
export type TarikSimpananInput = z.infer<typeof tarikSimpananSchema>
