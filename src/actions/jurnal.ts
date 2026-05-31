"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { jurnalManualSchema } from "@/lib/validations/jurnal"
import { buatJurnal } from "@/lib/jurnal"
import { catatLog } from "@/lib/audit"

export async function getJurnalList(params: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { search, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (search) {
    where.OR = [
      { noJurnal: { contains: search } },
      { keterangan: { contains: search } },
    ]
  }

  const [raw, total] = await Promise.all([
    prisma.jurnalUmum.findMany({
      where,
      include: {
        detail: {
          include: { akun: { select: { kode: true, nama: true } } },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { tanggal: "desc" },
    }),
    prisma.jurnalUmum.count({ where }),
  ])

  const data = raw.map((j) => ({
    id: j.id,
    noJurnal: j.noJurnal,
    tanggal: j.tanggal.toISOString(),
    keterangan: j.keterangan,
    totalDebit: j.detail.reduce((s, d) => s + Number(d.debit), 0),
    totalKredit: j.detail.reduce((s, d) => s + Number(d.kredit), 0),
    detail: j.detail.map((d) => ({
      akunKode: d.akun.kode,
      akunNama: d.akun.nama,
      debit: Number(d.debit),
      kredit: Number(d.kredit),
    })),
    createdAt: j.createdAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getJurnalById(jurnalId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.jurnalUmum.findUnique({
    where: { id: jurnalId },
    include: {
      detail: {
        include: { akun: { select: { kode: true, nama: true } } },
      },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    noJurnal: raw.noJurnal,
    tanggal: raw.tanggal.toISOString(),
    keterangan: raw.keterangan,
    totalDebit: raw.detail.reduce((s, d) => s + Number(d.debit), 0),
    totalKredit: raw.detail.reduce((s, d) => s + Number(d.kredit), 0),
    detail: raw.detail.map((d) => ({
      akunKode: d.akun.kode,
      akunNama: d.akun.nama,
      debit: Number(d.debit),
      kredit: Number(d.kredit),
    })),
    createdAt: raw.createdAt.toISOString(),
  }
}

export async function createJurnalManual(input: z.infer<typeof jurnalManualSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = jurnalManualSchema.parse(input)

  const akunList = await prisma.akun.findMany({
    where: { id: { in: parsed.entries.map((e) => e.akunId) } },
  })
  const akunMap = new Map(akunList.map((a) => [a.id, a]))

  for (const e of parsed.entries) {
    if (!akunMap.has(e.akunId)) {
      throw new Error(`Akun tidak ditemukan: ${e.akunId}`)
    }
  }

  let noJurnal = ""
  await prisma.$transaction(async (tx) => {
    noJurnal = await buatJurnal(tx, {
      tanggal: new Date(parsed.tanggal),
      keterangan: parsed.keterangan,
      entries: parsed.entries.map((e) => ({
        akunKode: akunMap.get(e.akunId)!.kode,
        debit: e.debit,
        kredit: e.kredit,
      })),
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "JURNAL_MANUAL",
    entityId: noJurnal,
    newValue: { keterangan: parsed.keterangan, entries: parsed.entries.length },
  })

  revalidatePath("/pengurus/jurnal")
  return { success: true }
}

export async function getBukuBesar(
  akunId?: string,
  tanggalMulai?: string,
  tanggalSelesai?: string,
  page = 1,
  pageSize = 20
) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const whereDetail: Record<string, unknown> = {}
  if (akunId) whereDetail.akunId = akunId

  const whereJurnal: Record<string, unknown> = {}
  if (tanggalMulai || tanggalSelesai) {
    const filter: Record<string, Date> = {}
    if (tanggalMulai) filter.gte = new Date(tanggalMulai + "T00:00:00")
    if (tanggalSelesai) filter.lte = new Date(tanggalSelesai + "T23:59:59")
    whereJurnal.tanggal = filter
  }

  const akun = akunId
    ? await prisma.akun.findUnique({ where: { id: akunId } })
    : null

  const where = { ...whereDetail, jurnal: whereJurnal }

  const [total, allBefore, detail] = await Promise.all([
    prisma.detailJurnal.count({ where }),
    prisma.detailJurnal.findMany({
      where,
      include: {
        akun: { select: { saldoNormal: true } },
      },
      orderBy: [{ jurnal: { tanggal: "asc" } }, { jurnal: { noJurnal: "asc" } }],
      take: (page - 1) * pageSize,
    }),
    prisma.detailJurnal.findMany({
      where,
      include: {
        jurnal: { select: { noJurnal: true, tanggal: true, keterangan: true } },
        akun: { select: { id: true, kode: true, nama: true, saldoNormal: true } },
      },
      orderBy: [{ jurnal: { tanggal: "asc" } }, { jurnal: { noJurnal: "asc" } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  let saldoAwal = 0
  for (const d of allBefore) {
    if (d.akun.saldoNormal === "DEBIT") {
      saldoAwal += Number(d.debit) - Number(d.kredit)
    } else {
      saldoAwal += Number(d.kredit) - Number(d.debit)
    }
  }

  const data = detail.map((d) => ({
    jurnalId: d.jurnalId,
    noJurnal: d.jurnal.noJurnal,
    tanggal: d.jurnal.tanggal.toISOString(),
    keterangan: d.jurnal.keterangan,
    akunId: d.akunId,
    akunKode: d.akun.kode,
    akunNama: d.akun.nama,
    saldoNormal: d.akun.saldoNormal,
    debit: Number(d.debit),
    kredit: Number(d.kredit),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize), saldoAwal: Math.round(saldoAwal * 100) / 100 }
}

export async function getNeracaSaldo(tanggalSelesai?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const whereJurnal: Record<string, unknown> = {}
  if (tanggalSelesai) {
    whereJurnal.tanggal = { lte: new Date(tanggalSelesai + "T23:59:59") }
  }

  const detail = await prisma.detailJurnal.findMany({
    where: { jurnal: whereJurnal },
    include: { akun: true },
  })

  const saldoMap = new Map<
    string,
    { kode: string; nama: string; tipe: string; saldoNormal: string; debit: number; kredit: number }
  >()

  for (const d of detail) {
    const key = d.akunId
    const existing = saldoMap.get(key) ?? {
      kode: d.akun.kode,
      nama: d.akun.nama,
      tipe: d.akun.tipe,
      saldoNormal: d.akun.saldoNormal,
      debit: 0,
      kredit: 0,
    }
    existing.debit += Number(d.debit)
    existing.kredit += Number(d.kredit)
    saldoMap.set(key, existing)
  }

  const akunAll = await prisma.akun.findMany({ orderBy: { kode: "asc" } })
  const result = akunAll.map((a) => {
    const s = saldoMap.get(a.id)
    const debit = s?.debit ?? 0
    const kredit = s?.kredit ?? 0
    const saldo = a.saldoNormal === "DEBIT" ? debit - kredit : kredit - debit
    return {
      akunId: a.id,
      kode: a.kode,
      nama: a.nama,
      tipe: a.tipe,
      debit,
      kredit,
      saldo: Math.max(0, saldo),
      saldoNormal: a.saldoNormal,
    }
  })

  const totalDebit = result.reduce((s, r) => s + r.debit, 0)
  const totalKredit = result.reduce((s, r) => s + r.kredit, 0)

  return { data: result, totalDebit, totalKredit }
}

export async function getAkunList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  return prisma.akun.findMany({
    where: { isActive: true },
    orderBy: { kode: "asc" },
    select: { id: true, kode: true, nama: true, tipe: true, saldoNormal: true },
  })
}

async function getSaldoAkunTipe(
  tipe: string,
  sampaiTanggal?: Date,
  dariTanggal?: Date,
  excludeClosing = false
) {
  const akunAll = await prisma.akun.findMany({
    where: { tipe: tipe as any, isActive: true },
  })
  const akunIds = akunAll.map((a) => a.id)

  const whereDetail: Record<string, unknown> = {
    akunId: { in: akunIds },
  }
  const whereJurnal: Record<string, unknown> = {}
  if (dariTanggal && sampaiTanggal) {
    whereJurnal.tanggal = { gte: dariTanggal, lte: sampaiTanggal }
  } else if (sampaiTanggal) {
    whereJurnal.tanggal = { lte: sampaiTanggal }
  }
  if (excludeClosing) {
    whereJurnal.keterangan = { not: { contains: "Jurnal Penutup" } }
  }

  const detail = await prisma.detailJurnal.findMany({
    where: { ...whereDetail, jurnal: whereJurnal },
  })

  const saldoMap = new Map<string, number>()
  for (const a of akunAll) {
    saldoMap.set(a.id, 0)
  }

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
    return { kode: a.kode, nama: a.nama, saldo }
  })

  total = Math.round(total * 100) / 100
  return { items, total }
}

export async function getNeraca(sampai?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const sampaiTanggal = sampai ? new Date(sampai + "T23:59:59") : undefined

  const [aset, liabilitas, ekuitas, pendapatan, beban] = await Promise.all([
    getSaldoAkunTipe("ASET", sampaiTanggal),
    getSaldoAkunTipe("LIABILITAS", sampaiTanggal),
    getSaldoAkunTipe("EKUITAS", sampaiTanggal),
    getSaldoAkunTipe("PENDAPATAN", sampaiTanggal),
    getSaldoAkunTipe("BEBAN", sampaiTanggal),
  ])

  // Include laba bersih sebagai bagian ekuitas agar neraca balance
  // meskipun jurnal penutup belum dijalankan (3.1.2 masih 0)
  const labaBersih = pendapatan.total - beban.total
  const adjustedEkuitas = [...ekuitas.items]
  const shuIdx = adjustedEkuitas.findIndex((i) => i.kode === "3.1.2")
  const existingSHUSaldo = shuIdx >= 0 ? ekuitas.items[shuIdx]!.saldo : 0
  if (labaBersih !== 0) {
    if (shuIdx >= 0) {
      adjustedEkuitas[shuIdx] = { ...adjustedEkuitas[shuIdx]!, saldo: labaBersih }
    } else {
      adjustedEkuitas.push({ kode: "3.1.2", nama: "SHU Tahun Berjalan", saldo: labaBersih })
    }
  }

  return {
    aset,
    liabilitas,
    ekuitas: {
      items: adjustedEkuitas,
      total: ekuitas.total + labaBersih - existingSHUSaldo,
    },
  }
}

export async function getLabaRugi(dari?: string, sampai?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const dariTanggal = dari ? new Date(dari + "T00:00:00") : undefined
  const sampaiTanggal = sampai ? new Date(sampai + "T23:59:59") : undefined

  const [pendapatan, beban] = await Promise.all([
    getSaldoAkunTipe("PENDAPATAN", sampaiTanggal, dariTanggal, true),
    getSaldoAkunTipe("BEBAN", sampaiTanggal, dariTanggal, true),
  ])

  const labaBersih = pendapatan.total - beban.total

  return { pendapatan, beban, labaBersih }
}

export async function getArusKas(dari?: string, sampai?: string, page = 1, pageSize = 20) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const tanggalMulai = dari ? new Date(dari + "T00:00:00") : new Date("2020-01-01T00:00:00")
  const tanggalSelesai = sampai ? new Date(sampai + "T23:59:59") : new Date()

  const kasAkun = await prisma.akun.findFirst({
    where: { kode: "1.1.1", isActive: true },
  })
  if (!kasAkun) return { items: [], totalMasuk: 0, totalKeluar: 0, saldoAkhir: 0, total: 0, page: 1, totalPages: 0 }

  const whereKas = {
    akunId: kasAkun.id,
    jurnal: {
      tanggal: { gte: tanggalMulai, lte: tanggalSelesai },
    },
  }

  const [aggregate, total, detail] = await Promise.all([
    prisma.detailJurnal.aggregate({
      where: whereKas,
      _sum: { debit: true, kredit: true },
    }),
    prisma.detailJurnal.count({ where: whereKas }),
    prisma.detailJurnal.findMany({
      where: whereKas,
      include: {
        jurnal: { select: { tanggal: true, keterangan: true, noJurnal: true } },
      },
      orderBy: { jurnal: { tanggal: "asc" } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const totalMasuk = Number(aggregate._sum.debit ?? 0)
  const totalKeluar = Number(aggregate._sum.kredit ?? 0)

  const items = detail.map((d) => ({
    tanggal: d.jurnal.tanggal.toISOString(),
    noJurnal: d.jurnal.noJurnal,
    keterangan: d.jurnal.keterangan,
    masuk: Number(d.debit),
    keluar: Number(d.kredit),
  }))

  return { items, totalMasuk, totalKeluar, saldoAkhir: totalMasuk - totalKeluar, total, page, totalPages: Math.ceil(total / pageSize) }
}
