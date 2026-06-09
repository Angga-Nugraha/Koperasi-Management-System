/**
 * @file src/lib/jurnal.ts
 * @description Logika inti akuntansi, pembuatan entri jurnal otomatis, dan perhitungan saldo COA.
 */

import { AccountType, Prisma } from "@prisma/client"
import { prisma, PrismaTx } from "@/lib/prisma"
import { round2 } from "@/lib/math"
import crypto from "crypto"
import { assertRole } from "@/lib/auth"

type JurnalEntry = {
  akunKode: string
  debit: number
  kredit: number
}

export async function buatJurnal(
  tx: PrismaTx,
  params: {
    tanggal: Date
    keterangan: string
    entries: JurnalEntry[]
    createdById?: string
  },
) {
  const { tanggal, keterangan, entries, createdById } = params

  const dateStr = `${tanggal.getFullYear()}${String(tanggal.getMonth() + 1).padStart(2, "0")}${String(tanggal.getDate()).padStart(2, "0")}`
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase()
  const noJurnal = `JRN-${dateStr}-${suffix}`

  const akunMap = new Map<string, string>()
  const akunList = await tx.akun.findMany({
    where: { kode: { in: entries.map((e) => e.akunKode) } },
  })
  for (const a of akunList) {
    akunMap.set(a.kode, a.id)
  }

  for (const e of entries) {
    if (!akunMap.has(e.akunKode)) {
      throw new Error(`Akun dengan kode ${e.akunKode} tidak ditemukan`)
    }
  }

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0)
  const totalKredit = entries.reduce((s, e) => s + e.kredit, 0)
  if (Math.abs(totalDebit - totalKredit) > 0.01) {
    throw new Error(`Jurnal tidak balance: debit ${totalDebit} ≠ kredit ${totalKredit}`)
  }

  await tx.jurnalUmum.create({
    data: {
      noJurnal,
      tanggal,
      keterangan,
      createdById,
      detail: {
        create: entries.map((e) => ({
          akunId: akunMap.get(e.akunKode)!,
          debit: e.debit,
          kredit: e.kredit,
        })),
      },
    },
  })

  return noJurnal
}

export async function getSaldoAkun(
  akunKode: string,
  sampaiTanggal?: Date,
  tx?: PrismaTx,
): Promise<number> {
  if (!tx) await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const client = tx ?? prisma
  const akun = await client.akun.findUnique({ where: { kode: akunKode } })
  if (!akun) return 0

  const detail = await client.detailJurnal.findMany({
    where: {
      akun: { kode: akunKode },
      ...(sampaiTanggal ? { jurnal: { tanggal: { lte: sampaiTanggal } } } : {}),
    },
    include: { jurnal: true },
  })

  let totalDebit = 0
  let totalKredit = 0
  for (const d of detail) {
    totalDebit += Number(d.debit)
    totalKredit += Number(d.kredit)
  }

  if (akun.saldoNormal === "DEBIT") {
    return totalDebit - totalKredit
  } else {
    return totalKredit - totalDebit
  }
}

export const COA_KAS = "1.1.1"
export const COA_BANK = "1.1.2"
export const COA_BANK_BRI = "1.1.3"
export const COA_BANK_MANDIRI = "1.1.4"
export const COA_SIMPANAN_POKOK = "2.1.1"
export const COA_SIMPANAN_WAJIB = "2.1.2"
export const COA_SIMPANAN_SUKARELA = "2.1.3"
export const COA_PIUTANG_PINJAMAN = "1.2.1"
export const COA_SHU_BERJALAN = "3.1.2"
export const COA_SHU_DITAHAN = "3.1.3"
export const COA_PENDAPATAN_JASA = "4.1.1"
export const COA_PENDAPATAN_DENDA = "4.1.3"

export const COA_KAS_BANK = [COA_KAS, COA_BANK, COA_BANK_BRI, COA_BANK_MANDIRI] as const

export function getSimpananAkun(jenis: string): string {
  switch (jenis) {
    case "POKOK":
      return COA_SIMPANAN_POKOK
    case "WAJIB":
      return COA_SIMPANAN_WAJIB
    case "SUKARELA":
      return COA_SIMPANAN_SUKARELA
    default:
      return COA_SIMPANAN_SUKARELA
  }
}

export async function getSaldoAkunTipe(
  tipe: string,
  sampaiTanggal?: Date,
  dariTanggal?: Date,
  excludeClosing = false,
  tx?: PrismaTx,
) {
  if (!tx) await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const client = tx ?? prisma
  const akunAll = await client.akun.findMany({
    where: { tipe: tipe as AccountType, isActive: true },
    orderBy: { kode: "asc" },
  })
  const akunIds = akunAll.map((a) => a.id)

  const jurnalWhere: Prisma.JurnalUmumWhereInput = {}
  if (dariTanggal && sampaiTanggal) {
    jurnalWhere.tanggal = { gte: dariTanggal, lte: sampaiTanggal }
  } else if (sampaiTanggal) {
    jurnalWhere.tanggal = { lte: sampaiTanggal }
  }
  if (excludeClosing) {
    jurnalWhere.keterangan = { not: { contains: "Jurnal Penutup" } }
  }

  const detail = await client.detailJurnal.findMany({
    where: {
      akunId: { in: akunIds },
      ...(Object.keys(jurnalWhere).length > 0 ? { jurnal: jurnalWhere } : {}),
    },
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
    const saldo = round2(saldoMap.get(a.id) ?? 0)
    total += saldo
    return { kode: a.kode, nama: a.nama, saldo }
  })

  total = round2(total)
  return { items, total }
}
