/**
 * @file src/lib/where.ts
 * @description Builder filter query database yang aman dan bertipe data kuat.
 */

import { Prisma } from "@prisma/client"

export type WhereInput<T> = T extends Prisma.$JurnalUmumPayload ? Prisma.JurnalUmumWhereInput
  : T extends Prisma.$AnggotaPayload ? Prisma.AnggotaWhereInput
  : T extends Prisma.$PinjamanPayload ? Prisma.PinjamanWhereInput
  : T extends Prisma.$SimpananPayload ? Prisma.SimpananWhereInput
  : T extends Prisma.$DetailJurnalPayload ? Prisma.DetailJurnalWhereInput
  : T extends Prisma.$AkunPayload ? Prisma.AkunWhereInput
  : Record<string, unknown>

export function jurnalFilter(params: {
  search?: string
  dari?: string
  sampai?: string
}): Prisma.JurnalUmumWhereInput {
  const where: Prisma.JurnalUmumWhereInput = {}
  if (params.search) {
    where.OR = [
      { noJurnal: { contains: params.search } },
      { keterangan: { contains: params.search } },
    ]
  }
  if (params.dari || params.sampai) {
    const filter: Prisma.DateTimeFilter = {}
    if (params.dari) filter.gte = new Date(params.dari)
    if (params.sampai) filter.lte = new Date(params.sampai)
    where.tanggal = filter
  }
  return where
}

export function anggotaFilter(params: {
  search?: string
  status?: string
}): Prisma.AnggotaWhereInput {
  const where: Prisma.AnggotaWhereInput = {}
  if (params.status && params.status !== "SEMUA") {
    where.status = params.status as any
  }
  if (params.search) {
    where.OR = [
      { nama: { contains: params.search } },
      { nik: { contains: params.search } },
      { noAnggota: { contains: params.search } },
    ]
  }
  return where
}

export function detailJurnalFilter(params: {
  akunId?: string
  dariTanggal?: Date
  sampaiTanggal?: Date
  excludeClosing?: boolean
  akunIds?: string[]
}): Prisma.DetailJurnalWhereInput {
  const where: Prisma.DetailJurnalWhereInput = {}
  if (params.akunIds?.length) {
    where.akunId = { in: params.akunIds }
  }
  if (params.akunId) {
    where.akunId = params.akunId
  }
  const jurnalWhere: Prisma.JurnalUmumWhereInput = {}
  if (params.dariTanggal && params.sampaiTanggal) {
    jurnalWhere.tanggal = { gte: params.dariTanggal, lte: params.sampaiTanggal }
  } else if (params.sampaiTanggal) {
    jurnalWhere.tanggal = { lte: params.sampaiTanggal }
  }
  if (params.excludeClosing) {
    jurnalWhere.keterangan = { not: { contains: "Jurnal Penutup" } }
  }
  if (Object.keys(jurnalWhere).length > 0) {
    where.jurnal = jurnalWhere
  }
  return where
}

export function anggotaTanggalFilter(tglMasuk: Date): {
  gte: Date
  lt: Date
} {
  const nextDay = new Date(tglMasuk)
  nextDay.setDate(nextDay.getDate() + 1)
  return { gte: tglMasuk, lt: nextDay }
}
