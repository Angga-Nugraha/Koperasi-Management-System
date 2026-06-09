/**
 * @file src/lib/shu.ts
 * @description Logika perhitungan Sisa Hasil Usaha (SHU) jasa modal dan jasa anggota.
 */

import { prisma, PrismaTx } from "@/lib/prisma"
import Decimal from "decimal.js"
import { tahunMulai, tahunSelesai } from "@/lib/date"
import { assertRole } from "@/lib/auth"
import { round2 } from "@/lib/math"

export type IndikatorSHUData = {
  id: string
  kode: string
  nama: string
  persentase: number
  kelompok: string
  akunId: string | null
  urutan: number
  isActive: boolean
}

export async function getIndikatorSHU(): Promise<IndikatorSHUData[]> {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const rows = await prisma.indikatorSHU.findMany({
    orderBy: { urutan: "asc" },
  })
  return rows.map((r) => ({
    id: r.id,
    kode: r.kode,
    nama: r.nama,
    persentase: Number(r.persentase),
    kelompok: r.kelompok,
    akunId: r.akunId,
    urutan: r.urutan,
    isActive: r.isActive,
  }))
}

export async function saveIndikatorSHU(
  items: Array<{
    kode: string
    nama: string
    persentase: number
    kelompok: string
    akunId: string | null
    urutan: number
  }>,
) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const total = items.reduce((a, b) => a + b.persentase, 0)
  if (Math.abs(total - 100) > 0.01) throw new Error("Total persentase harus 100%")

  const kodes = items.map((i) => i.kode)

  await prisma.$transaction(async (tx) => {
    await tx.alokasiSHU.deleteMany({
      where: { indikator: { kode: { notIn: kodes } } },
    })
    await tx.indikatorSHU.deleteMany({
      where: { kode: { notIn: kodes } },
    })

    for (const item of items) {
      await tx.indikatorSHU.upsert({
        where: { kode: item.kode },
        create: item,
        update: { ...item },
      })
    }
  })
}

export async function deleteIndikatorSHU(kode: string) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  await prisma.indikatorSHU.delete({ where: { kode } })
}

export async function getTotalPendapatanBeban(tahun: number, tx?: PrismaTx) {
  if (!tx) await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const client = tx ?? prisma
  const mulai = tahunMulai(tahun)
  const selesai = tahunSelesai(tahun)

  const detail = await client.detailJurnal.findMany({
    where: {
      jurnal: {
        tanggal: { gte: mulai, lt: selesai },
      },
    },
    include: { akun: true },
  })

  let totalPendapatan = 0
  let totalBeban = 0

  for (const d of detail) {
    if (d.akun.tipe === "PENDAPATAN") {
      totalPendapatan = new Decimal(totalPendapatan)
        .plus(Number(d.kredit))
        .minus(Number(d.debit))
        .toNumber()
    }
    if (d.akun.tipe === "BEBAN") {
      totalBeban = new Decimal(totalBeban).plus(Number(d.debit)).minus(Number(d.kredit)).toNumber()
    }
  }

  return {
    totalPendapatan: round2(totalPendapatan),
    totalBeban: round2(totalBeban),
    totalSHU: round2(totalPendapatan - totalBeban),
  }
}

export async function getSaldoPerAnggota(tx?: PrismaTx) {
  if (!tx) await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const client = tx ?? prisma
  const simpanan = await client.simpanan.findMany({
    select: { anggotaId: true, saldo: true },
  })

  const perAnggota = new Map<string, number>()
  for (const s of simpanan) {
    perAnggota.set(s.anggotaId, (perAnggota.get(s.anggotaId) ?? 0) + Number(s.saldo))
  }

  let total = 0
  for (const v of perAnggota.values()) total += v

  return { perAnggota, totalSimpanan: round2(total) }
}

export async function getTotalAngsuranAnggota(tahun: number, tx?: PrismaTx) {
  if (!tx) await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const client = tx ?? prisma
  const mulai = tahunMulai(tahun)
  const selesai = tahunSelesai(tahun)

  const angsuran = await client.angsuran.findMany({
    where: {
      tglBayar: { gte: mulai, lt: selesai },
      status: "LUNAS",
    },
    include: {
      pinjaman: { select: { anggotaId: true } },
    },
  })

  const perAnggota = new Map<string, number>()
  for (const a of angsuran) {
    const id = a.pinjaman.anggotaId
    perAnggota.set(id, (perAnggota.get(id) ?? 0) + Number(a.pokok))
  }

  let total = 0
  for (const v of perAnggota.values()) total += v

  return { perAnggota, total: round2(total) }
}

export async function hitungSHU(tahun: number) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const keuangan = await getTotalPendapatanBeban(tahun)

  const indikator = (await getIndikatorSHU()).filter((i) => i.isActive)
  if (indikator.length === 0) throw new Error("Belum ada indikator SHU yang aktif")

  const shuBersih = Math.max(0, keuangan.totalSHU)

  const anggotaIndikator = indikator.filter((i) => i.kelompok === "ANGGOTA")
  const { totalSimpanan, perAnggota: saldoPerAnggota } = await getSaldoPerAnggota()
  const totalAngsuran = await getTotalAngsuranAnggota(tahun)

  const anggotaList = await prisma.anggota.findMany({
    where: { status: "AKTIF" },
    select: { id: true, nama: true, noAnggota: true },
  })

  const perAnggota: Array<{
    anggotaId: string
    noAnggota: string
    nama: string
    jasaModal: number
    jasaUsaha: number
    total: number
  }> = []

  for (const anggota of anggotaList) {
    const saldo = saldoPerAnggota.get(anggota.id) ?? 0
    const angsuranPokok = totalAngsuran.perAnggota.get(anggota.id) ?? 0

    let jm = 0
    let ju = 0

    for (const ind of anggotaIndikator) {
      const dana = shuBersih * (ind.persentase / 100)
      if (ind.kode === "JM") {
        jm = totalSimpanan > 0 ? dana * (saldo / totalSimpanan) : 0
      } else if (ind.kode === "JU") {
        ju = totalAngsuran.total > 0 ? dana * (angsuranPokok / totalAngsuran.total) : 0
      }
    }

    const total = round2(jm + ju)

    perAnggota.push({
      anggotaId: anggota.id,
      noAnggota: anggota.noAnggota,
      nama: anggota.nama,
      jasaModal: round2(jm),
      jasaUsaha: round2(ju),
      total,
    })
  }

  const alokasiMap: Record<string, { persentase: number; nominal: number }> = {}
  for (const ind of indikator) {
    const nominal = shuBersih * (ind.persentase / 100)
    alokasiMap[ind.kode] = {
      persentase: ind.persentase,
      nominal: round2(nominal),
    }
  }

  return {
    keuangan,
    indikator,
    alokasi: alokasiMap,
    perAnggota,
    totalAnggota: anggotaList.length,
  }
}
