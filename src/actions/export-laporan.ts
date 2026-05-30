"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getKonfig, getNumber } from "@/lib/konfig"

async function getSaldoAkunTipe(tipe: string, sampaiTanggal?: Date) {
  const akunAll = await prisma.akun.findMany({
    where: { tipe: tipe as any, isActive: true },
  })
  const akunIds = akunAll.map((a) => a.id)

  const whereDetail: Record<string, unknown> = {
    akunId: { in: akunIds },
  }
  const whereJurnal: Record<string, unknown> = {}
  if (sampaiTanggal) {
    whereJurnal.tanggal = { lte: sampaiTanggal }
  }

  const detail = await prisma.detailJurnal.findMany({
    where: { ...whereDetail, jurnal: whereJurnal },
  })

  const saldoMap = new Map<string, number>()
  for (const a of akunAll) saldoMap.set(a.id, 0)

  for (const d of detail) {
    const akun = akunAll.find((a) => a.id === d.akunId)
    if (!akun) continue
    const current = saldoMap.get(d.akunId) ?? 0
    if (akun.saldoNormal === "DEBIT") {
      saldoMap.set(d.akunId, current + Number(d.debit) - Number(d.kredit))
    } else {
      saldoMap.set(d.akunId, current + Number(d.kredit) - Number(d.debit))
    }
  }

  let total = 0
  const items = akunAll.map((a) => {
    const saldo = Math.round((saldoMap.get(a.id) ?? 0) * 100) / 100
    total += saldo
    return { kode: a.kode, nama: a.nama, saldo, saldoNormal: a.saldoNormal }
  })
  return { items, total: Math.round(total * 100) / 100 }
}

type Param = { dari?: string; sampai?: string; akunId?: string }

export async function exportBukuBesar(params: Param) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { dari, sampai, akunId } = params
  const ExcelJS = await import("exceljs")

  const akun = akunId ? await prisma.akun.findUnique({ where: { id: akunId } }) : null
  const whereJurnal: Record<string, unknown> = {}
  if (dari || sampai) {
    const filter: Record<string, Date> = {}
    if (dari) filter.gte = new Date(dari)
    if (sampai) filter.lte = new Date(sampai)
    whereJurnal.tanggal = filter
  }

  const detail = akunId
    ? await prisma.detailJurnal.findMany({
        where: { akunId, jurnal: whereJurnal },
        include: {
          jurnal: { select: { noJurnal: true, tanggal: true, keterangan: true } },
        },
        orderBy: [{ jurnal: { tanggal: "asc" } }, { jurnal: { noJurnal: "asc" } }],
      })
    : []

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Buku Besar")
  ws.columns = [
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "No Jurnal", key: "noJurnal", width: 20 },
    { header: "Keterangan", key: "keterangan", width: 40 },
    { header: "Debit", key: "debit", width: 18 },
    { header: "Kredit", key: "kredit", width: 18 },
    { header: "Saldo", key: "saldo", width: 18 },
  ]
  ws.getRow(1).font = { bold: true }

  if (akun) {
    ws.addRow({ tanggal: "", noJurnal: "", keterangan: `Akun: ${akun.kode} - ${akun.nama}`, debit: "", kredit: "", saldo: "" })
  }

  let saldo = 0
  for (const d of detail) {
    const s = akun?.saldoNormal === "DEBIT"
      ? Math.round((saldo + Number(d.debit) - Number(d.kredit)) * 100) / 100
      : Math.round((saldo + Number(d.kredit) - Number(d.debit)) * 100) / 100
    saldo = s
    ws.addRow({
      tanggal: d.jurnal.tanggal.toLocaleDateString("id-ID"),
      noJurnal: d.jurnal.noJurnal,
      keterangan: d.jurnal.keterangan,
      debit: Number(d.debit),
      kredit: Number(d.kredit),
      saldo: s,
    })
  }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}

export async function exportNeracaSaldo(params: Param) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const ExcelJS = await import("exceljs")

  const sampaiTanggal = params.sampai ? new Date(params.sampai) : undefined
  const detail = await prisma.detailJurnal.findMany({
    where: { jurnal: sampaiTanggal ? { tanggal: { lte: sampaiTanggal } } : {} },
    include: { akun: true },
  })

  const saldoMap = new Map<string, { kode: string; nama: string; debit: number; kredit: number }>()
  for (const d of detail) {
    const key = d.akunId
    const existing = saldoMap.get(key) ?? { kode: d.akun.kode, nama: d.akun.nama, debit: 0, kredit: 0 }
    existing.debit += Number(d.debit)
    existing.kredit += Number(d.kredit)
    saldoMap.set(key, existing)
  }

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Neraca Saldo")
  ws.columns = [
    { header: "Kode", key: "kode", width: 12 },
    { header: "Nama Akun", key: "nama", width: 30 },
    { header: "Debit", key: "debit", width: 18 },
    { header: "Kredit", key: "kredit", width: 18 },
  ]
  ws.getRow(1).font = { bold: true }

  const akunAll = await prisma.akun.findMany({ orderBy: { kode: "asc" } })
  for (const a of akunAll) {
    const s = saldoMap.get(a.id)
    ws.addRow({ kode: a.kode, nama: a.nama, debit: s?.debit ?? 0, kredit: s?.kredit ?? 0 })
  }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}

export async function exportNeraca(params: Param) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const ExcelJS = await import("exceljs")

  const sampaiTanggal = params.sampai ? new Date(params.sampai) : undefined
  const [aset, liabilitas, ekuitas] = await Promise.all([
    getSaldoAkunTipe("ASET", sampaiTanggal),
    getSaldoAkunTipe("LIABILITAS", sampaiTanggal),
    getSaldoAkunTipe("EKUITAS", sampaiTanggal),
  ])

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Neraca")
  ws.columns = [{ header: "Akun", key: "akun", width: 40 }, { header: "Saldo", key: "saldo", width: 20 }]
  ws.getRow(1).font = { bold: true }

  ws.addRow({ akun: "ASET", saldo: "" }).font = { bold: true }
  for (const i of aset.items) ws.addRow({ akun: `  ${i.kode} ${i.nama}`, saldo: i.saldo })
  ws.addRow({ akun: "Total Aset", saldo: aset.total }).font = { bold: true }
  ws.addRow({ akun: "", saldo: "" })
  ws.addRow({ akun: "KEWAJIBAN", saldo: "" }).font = { bold: true }
  for (const i of liabilitas.items) ws.addRow({ akun: `  ${i.kode} ${i.nama}`, saldo: i.saldo })
  ws.addRow({ akun: "Total Kewajiban", saldo: liabilitas.total }).font = { bold: true }
  ws.addRow({ akun: "", saldo: "" })
  ws.addRow({ akun: "EKUITAS", saldo: "" }).font = { bold: true }
  for (const i of ekuitas.items) ws.addRow({ akun: `  ${i.kode} ${i.nama}`, saldo: i.saldo })
  ws.addRow({ akun: "Total Ekuitas", saldo: ekuitas.total }).font = { bold: true }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}

export async function exportLabaRugi(params: Param) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const ExcelJS = await import("exceljs")

  const sampaiTanggal = params.sampai ? new Date(params.sampai) : undefined
  const [pendapatan, beban] = await Promise.all([
    getSaldoAkunTipe("PENDAPATAN", sampaiTanggal),
    getSaldoAkunTipe("BEBAN", sampaiTanggal),
  ])

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Laba Rugi")
  ws.columns = [{ header: "Akun", key: "akun", width: 40 }, { header: "Saldo", key: "saldo", width: 20 }]
  ws.getRow(1).font = { bold: true }

  ws.addRow({ akun: "PENDAPATAN", saldo: "" }).font = { bold: true }
  for (const i of pendapatan.items) ws.addRow({ akun: `  ${i.kode} ${i.nama}`, saldo: i.saldo })
  ws.addRow({ akun: "Total Pendapatan", saldo: pendapatan.total }).font = { bold: true }
  ws.addRow({ akun: "", saldo: "" })
  ws.addRow({ akun: "BEBAN", saldo: "" }).font = { bold: true }
  for (const i of beban.items) ws.addRow({ akun: `  ${i.kode} ${i.nama}`, saldo: i.saldo })
  ws.addRow({ akun: "Total Beban", saldo: beban.total }).font = { bold: true }
  ws.addRow({ akun: "", saldo: "" })
  ws.addRow({ akun: "Laba / Rugi Bersih", saldo: pendapatan.total - beban.total }).font = { bold: true }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}

export async function exportArusKas(params: Param) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const ExcelJS = await import("exceljs")

  const tanggalMulai = params.dari ? new Date(params.dari) : new Date("2020-01-01")
  const tanggalSelesai = params.sampai ? new Date(params.sampai) : new Date()

  const kasAkun = await prisma.akun.findFirst({ where: { kode: "1.1.1", isActive: true } })
  const detail = kasAkun
    ? await prisma.detailJurnal.findMany({
        where: { akunId: kasAkun.id, jurnal: { tanggal: { gte: tanggalMulai, lte: tanggalSelesai } } },
        include: { jurnal: { select: { tanggal: true, keterangan: true, noJurnal: true } } },
        orderBy: { jurnal: { tanggal: "asc" } },
      })
    : []

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Arus Kas")
  ws.columns = [
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "No Jurnal", key: "noJurnal", width: 20 },
    { header: "Keterangan", key: "keterangan", width: 40 },
    { header: "Masuk", key: "masuk", width: 18 },
    { header: "Keluar", key: "keluar", width: 18 },
  ]
  ws.getRow(1).font = { bold: true }

  let totalMasuk = 0, totalKeluar = 0
  for (const d of detail) {
    const masuk = Number(d.debit)
    const keluar = Number(d.kredit)
    totalMasuk += masuk
    totalKeluar += keluar
    ws.addRow({
      tanggal: d.jurnal.tanggal.toLocaleDateString("id-ID"),
      noJurnal: d.jurnal.noJurnal,
      keterangan: d.jurnal.keterangan,
      masuk,
      keluar,
    })
  }
  ws.addRow({ tanggal: "", noJurnal: "", keterangan: "TOTAL", masuk: totalMasuk, keluar: totalKeluar }).font = { bold: true }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}

export async function exportSHU(params: Param) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const ExcelJS = await import("exceljs")

  const sampaiTanggal = params.sampai ? new Date(params.sampai) : undefined
  const [pendapatan, beban] = await Promise.all([
    getSaldoAkunTipe("PENDAPATAN", sampaiTanggal),
    getSaldoAkunTipe("BEBAN", sampaiTanggal),
  ])
  const shuKotor = pendapatan.total - beban.total
  const konfig = await getKonfig()
  const pctCadangan = getNumber(konfig, "alokasi_cad", 20)
  const cadangan = Math.round(shuKotor * (pctCadangan / 100) * 100) / 100
  const shuDibagi = shuKotor - cadangan
  const jumlahAnggota = await prisma.anggota.count({ where: { status: "AKTIF" } })

  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("SHU")
  ws.columns = [{ header: "Keterangan", key: "ket", width: 40 }, { header: "Jumlah", key: "jumlah", width: 20 }]
  ws.getRow(1).font = { bold: true }

  ws.addRow({ ket: "Total Pendapatan", jumlah: pendapatan.total })
  ws.addRow({ ket: "Total Beban", jumlah: beban.total })
  ws.addRow({ ket: "SHU Kotor", jumlah: shuKotor }).font = { bold: true }
  ws.addRow({ ket: "Cadangan (" + pctCadangan + "%)", jumlah: cadangan })
  ws.addRow({ ket: "SHU Dibagi", jumlah: shuDibagi }).font = { bold: true }
  ws.addRow({ ket: "Jumlah Anggota Aktif", jumlah: jumlahAnggota })
  ws.addRow({ ket: "SHU per Anggota", jumlah: jumlahAnggota > 0 ? Math.round((shuDibagi / jumlahAnggota) * 100) / 100 : 0 }).font = { bold: true }

  return wb.xlsx.writeBuffer() as Promise<Buffer>
}
