"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { formatTanggal } from "@/lib/format"

export async function exportJurnalExcel(params: {
  search?: string
  dari?: string
  sampai?: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

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
        noJurnal: j.noJurnal,
        tanggal: formatTanggal(j.tanggal),
        keterangan: j.keterangan,
        kodeAkun: d.akun.kode,
        namaAkun: d.akun.nama,
        debit: Number(d.debit),
        kredit: Number(d.kredit),
      })
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  return buffer as Buffer
}
