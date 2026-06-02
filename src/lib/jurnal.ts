import { prisma } from "@/lib/prisma"
import crypto from "crypto"

type JurnalEntry = {
  akunKode: string
  debit: number
  kredit: number
}

export async function buatJurnal(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: {
    tanggal: Date
    keterangan: string
    entries: JurnalEntry[]
    createdById?: string
  }
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
  sampaiTanggal?: Date
): Promise<number> {
  const akun = await prisma.akun.findUnique({ where: { kode: akunKode } })
  if (!akun) return 0

  const where: Record<string, unknown> = { akun: { kode: akunKode } }
  if (sampaiTanggal) {
    where.jurnal = { tanggal: { lte: sampaiTanggal } }
  }

  const detail = await prisma.detailJurnal.findMany({
    where,
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
export const COA_SIMPANAN_POKOK = "2.1.1"
export const COA_SIMPANAN_WAJIB = "2.1.2"
export const COA_SIMPANAN_SUKARELA = "2.1.3"
export const COA_PIUTANG_PINJAMAN = "1.2.1"
export const COA_PENDAPATAN_JASA = "4.1.1"
export const COA_PENDAPATAN_DENDA = "4.1.3"

export function getSimpananAkun(jenis: string): string {
  switch (jenis) {
    case "POKOK": return COA_SIMPANAN_POKOK
    case "WAJIB": return COA_SIMPANAN_WAJIB
    case "SUKARELA": return COA_SIMPANAN_SUKARELA
    default: throw new Error(`Jenis simpanan tidak dikenal: ${jenis}`)
  }
}

export async function getSaldoAkunTipe(
  tipe: string,
  sampaiTanggal?: Date,
  dariTanggal?: Date,
  excludeClosing = false
) {
  const akunAll = await prisma.akun.findMany({
    where: { tipe: tipe as any, isActive: true },
    orderBy: { kode: "asc" },
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
    return { kode: a.kode, nama: a.nama, saldo }
  })

  total = Math.round(total * 100) / 100
  return { items, total }
}
