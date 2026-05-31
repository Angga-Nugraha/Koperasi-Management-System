import { z } from "zod"

export const ajukanPinjamanSchema = z.object({
  anggotaId: z.string().min(1, "Anggota wajib dipilih"),
  jenisPinjamanId: z.string().min(1, "Jenis pinjaman wajib dipilih"),
  jumlah: z.number().positive("Jumlah pinjaman harus lebih dari 0"),
  tenor: z.number().int().min(1, "Tenor minimal 1 bulan"),
  keterangan: z.string().optional().nullable(),
})

export const setujuiPinjamanSchema = z.object({
  pinjamanId: z.string().min(1),
})

export const cairkanPinjamanSchema = z.object({
  pinjamanId: z.string().min(1),
})

export const bayarAngsuranSchema = z.object({
  pinjamanId: z.string().min(1),
  nominal: z.number().positive("Nominal pembayaran harus lebih dari 0"),
})

export const bayarAngsuranKeSchema = z.object({
  pinjamanId: z.string().min(1),
  angsuranKe: z.number().int().positive(),
})

export const hapusPinjamanSchema = z.object({
  pinjamanId: z.string().min(1),
})

export type AjukanPinjamanInput = z.infer<typeof ajukanPinjamanSchema>
export type SetujuiPinjamanInput = z.infer<typeof setujuiPinjamanSchema>
export type CairkanPinjamanInput = z.infer<typeof cairkanPinjamanSchema>
export type BayarAngsuranInput = z.infer<typeof bayarAngsuranSchema>
export type HapusPinjamanInput = z.infer<typeof hapusPinjamanSchema>
