/**
 * @file src/actions/export.ts
 * @description Server Action untuk menangani ekspor data umum ke berbagai format.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { assertRole } from "@/lib/auth"
import { formatTanggal } from "@/lib/format"
import { sanitizeCellValue } from "@/lib/excel"
import { jurnalFilter } from "@/lib/where"

export async function exportJurnalExcel(params: {
  search?: string
  dari?: string
  sampai?: string
}) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA", "PENGAWAS")

  const ExcelJS = await import("exceljs")

  const data = await prisma.jurnalUmum.findMany({
    where: jurnalFilter(params),
    include: {
      detail: {
        include: { akun: { select: { kode: true, nama: true } } },
      },
    },
    orderBy: { tanggal: "asc" },
    take: 10_000,
  })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Jurnal Umum")

  ws.columns = [
    { header: "No Jurnal", key: "noJurnal", width: 20 },
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Keterangan", key: "keterangan", width: 30 },
    { header: "Kode Akun", key: "kodeAkun", width: 12 },
    { header: "Nama Akun", key: "namaAkun", width: 25 },
    { header: "Debit", key: "debit", width: 18 },
    { header: "Kredit", key: "kredit", width: 18 },
  ]

  ws.getRow(1).font = { bold: true }

  for (const j of data) {
    for (const d of j.detail) {
      ws.addRow({
        noJurnal: sanitizeCellValue(j.noJurnal),
        tanggal: sanitizeCellValue(formatTanggal(j.tanggal)),
        keterangan: sanitizeCellValue(j.keterangan),
        kodeAkun: sanitizeCellValue(d.akun.kode),
        namaAkun: sanitizeCellValue(d.akun.nama),
        debit: Number(d.debit),
        kredit: Number(d.kredit),
      })
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  return new Uint8Array(buffer)
}
