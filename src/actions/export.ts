"use server"

import { prisma } from "@/lib/prisma"
import { auth, assertRole } from "@/lib/auth"
import { formatTanggal } from "@/lib/format"

function sanitizeCellValue(value: string | number | null | undefined): string | number {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) {
    return `'${value}`
  }
  return value ?? ""
}

export async function exportJurnalExcel(params: {
  search?: string
  dari?: string
  sampai?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const ExcelJS = await import("exceljs")

  const where: Record<string, unknown> = {}
  if (params.search) {
    where.OR = [
      { noJurnal: { contains: params.search } },
      { keterangan: { contains: params.search } },
    ]
  }
  if (params.dari || params.sampai) {
    const filter: Record<string, Date> = {}
    if (params.dari) filter.gte = new Date(params.dari)
    if (params.sampai) filter.lte = new Date(params.sampai)
    where.tanggal = filter
  }

  const data = await prisma.jurnalUmum.findMany({
    where,
    include: {
      detail: {
        include: { akun: { select: { kode: true, nama: true } } },
      },
    },
    orderBy: { tanggal: "asc" },
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
  return buffer as Buffer
}
