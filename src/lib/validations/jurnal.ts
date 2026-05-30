import { z } from "zod"

export const jurnalManualSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  keterangan: z.string().min(1, "Keterangan wajib diisi"),
  entries: z
    .array(
      z.object({
        akunId: z.string().min(1, "Akun wajib dipilih"),
        debit: z.number().min(0),
        kredit: z.number().min(0),
      })
    )
    .min(2, "Minimal 2 entry (debit dan kredit)")
    .refine(
      (entries) => {
        const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
        const totalKredit = entries.reduce((s, e) => s + e.kredit, 0)
        return Math.abs(totalDebit - totalKredit) < 0.01
      },
      { message: "Total debit harus sama dengan total kredit" }
    ),
})

export type JurnalManualInput = z.infer<typeof jurnalManualSchema>
