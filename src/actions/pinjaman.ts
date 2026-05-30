"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  ajukanPinjamanSchema,
  setujuiPinjamanSchema,
  cairkanPinjamanSchema,
  bayarAngsuranSchema,
  hapusPinjamanSchema,
} from "@/lib/validations/pinjaman"
import { z } from "zod"
import { buatJurnal, COA_KAS, COA_PIUTANG_PINJAMAN, COA_PENDAPATAN_JASA, COA_PENDAPATAN_DENDA } from "@/lib/jurnal"
import { catatLog } from "@/lib/audit"

export async function getPinjamanList(params: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { search, status, page = 1, pageSize = 15 } = params

  const where: Record<string, unknown> = {}
  if (status && status !== "SEMUA") where.status = status
  if (search) {
    where.anggota = { nama: { contains: search } }
  }

  const [raw, total] = await Promise.all([
    prisma.pinjaman.findMany({
      where,
      include: {
        anggota: { select: { id: true, nama: true, noAnggota: true } },
        jenisPinjaman: { select: { id: true, nama: true, bunga: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.pinjaman.count({ where }),
  ])

  const data = raw.map((p) => ({
    id: p.id,
    anggotaId: p.anggotaId,
    noAnggota: p.anggota.noAnggota,
    namaAnggota: p.anggota.nama,
    jenisPinjamanId: p.jenisPinjamanId,
    jenisPinjaman: p.jenisPinjaman.nama,
    jumlah: Number(p.jumlah),
    tenor: p.tenor,
    bunga: Number(p.bunga),
    sisaPinjaman: Number(p.sisaPinjaman),
    status: p.status,
    tglPengajuan: p.tglPengajuan.toISOString(),
    tglCair: p.tglCair?.toISOString() ?? null,
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getPinjamanById(pinjamanId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.pinjaman.findUnique({
    where: { id: pinjamanId },
    include: {
      anggota: { select: { id: true, nama: true, noAnggota: true } },
      jenisPinjaman: { select: { id: true, nama: true, bunga: true } },
      angsuran: { orderBy: { angsuranKe: "asc" } },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    anggotaId: raw.anggotaId,
    noAnggota: raw.anggota.noAnggota,
    namaAnggota: raw.anggota.nama,
    jenisPinjamanId: raw.jenisPinjamanId,
    jenisPinjaman: raw.jenisPinjaman.nama,
    jumlah: Number(raw.jumlah),
    tenor: raw.tenor,
    bunga: Number(raw.bunga),
    angsuranPokok: Number(raw.angsuranPokok),
    angsuranJasa: Number(raw.angsuranJasa),
    angsuranTotal: Number(raw.angsuranTotal),
    sisaPinjaman: Number(raw.sisaPinjaman),
    status: raw.status,
    tglPengajuan: raw.tglPengajuan.toISOString(),
    tglDisetujui: raw.tglDisetujui?.toISOString() ?? null,
    tglDitolak: raw.tglDitolak?.toISOString() ?? null,
    tglCair: raw.tglCair?.toISOString() ?? null,
    keterangan: raw.keterangan,
    createdAt: raw.createdAt.toISOString(),
    angsuran: raw.angsuran.map((a) => ({
      id: a.id,
      angsuranKe: a.angsuranKe,
      jatuhTempo: a.jatuhTempo.toISOString(),
      tglBayar: a.tglBayar?.toISOString() ?? null,
      pokok: Number(a.pokok),
      jasa: Number(a.jasa),
      denda: Number(a.denda),
      total: Number(a.total),
      status: a.status,
    })),
  }
}

export async function getPinjamanAnggota(anggotaId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.pinjaman.findMany({
    where: { anggotaId },
    include: {
      jenisPinjaman: { select: { id: true, nama: true, bunga: true } },
      angsuran: { orderBy: { angsuranKe: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return raw.map((p) => ({
    id: p.id,
    jenisPinjaman: p.jenisPinjaman.nama,
    jumlah: Number(p.jumlah),
    tenor: p.tenor,
    bunga: Number(p.bunga),
    angsuranPokok: Number(p.angsuranPokok),
    angsuranJasa: Number(p.angsuranJasa),
    angsuranTotal: Number(p.angsuranTotal),
    sisaPinjaman: Number(p.sisaPinjaman),
    status: p.status,
    tglPengajuan: p.tglPengajuan.toISOString(),
    tglCair: p.tglCair?.toISOString() ?? null,
    keterangan: p.keterangan,
    angsuran: p.angsuran.map((a) => ({
      id: a.id,
      angsuranKe: a.angsuranKe,
      jatuhTempo: a.jatuhTempo.toISOString(),
      tglBayar: a.tglBayar?.toISOString() ?? null,
      pokok: Number(a.pokok),
      jasa: Number(a.jasa),
      denda: Number(a.denda),
      total: Number(a.total),
      status: a.status,
    })),
  }))
}

export async function ajukanPinjaman(input: z.infer<typeof ajukanPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = ajukanPinjamanSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const jenis = await prisma.jenisPinjaman.findUnique({ where: { id: parsed.jenisPinjamanId } })
  if (!jenis) throw new Error("Jenis pinjaman tidak ditemukan")

  const angsuranPokok = Number((parsed.jumlah / parsed.tenor).toFixed(2))
  const angsuranJasa = Number((parsed.jumlah * (Number(jenis.bunga) / 100)).toFixed(2))
  const angsuranTotal = Number((angsuranPokok + angsuranJasa).toFixed(2))

  const created = await prisma.pinjaman.create({
    data: {
      anggotaId: parsed.anggotaId,
      jenisPinjamanId: parsed.jenisPinjamanId,
      jumlah: parsed.jumlah,
      tenor: parsed.tenor,
      bunga: Number(jenis.bunga),
      angsuranPokok,
      angsuranJasa,
      angsuranTotal,
      sisaPinjaman: 0,
      status: "PENGAJUAN",
      tglPengajuan: new Date(),
      keterangan: parsed.keterangan || null,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PINJAMAN",
    entityId: created.id,
    newValue: { anggotaId: parsed.anggotaId, jumlah: parsed.jumlah, tenor: parsed.tenor },
  })

  revalidatePath("/pengurus/pinjaman")
  return { success: true }
}

export async function setujuiPinjaman(input: z.infer<typeof setujuiPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setujuiPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status !== "PENGAJUAN") throw new Error("Pinjaman sudah diproses")

  await prisma.pinjaman.update({
    where: { id: parsed.pinjamanId },
    data: {
      status: "DISETUJUI",
      tglDisetujui: new Date(),
      disetujuiOlehId: session.user.id,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "DISETUJUI" },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function tolakPinjaman(input: z.infer<typeof setujuiPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setujuiPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status !== "PENGAJUAN") throw new Error("Pinjaman sudah diproses")

  await prisma.pinjaman.update({
    where: { id: parsed.pinjamanId },
    data: { status: "DITOLAK", tglDitolak: new Date() },
  })

  await catatLog({
    userId: session.user.id,
    action: "REJECT",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "DITOLAK" },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function cairkanPinjaman(input: z.infer<typeof cairkanPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = cairkanPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status !== "DISETUJUI") throw new Error("Pinjaman harus disetujui terlebih dahulu")

  const tglCair = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.pinjaman.update({
      where: { id: parsed.pinjamanId },
      data: {
        status: "DICAIKKAN",
        tglCair,
        sisaPinjaman: Number(pinjaman.jumlah),
      },
    })

    const angsuranData = Array.from({ length: pinjaman.tenor }, (_, i) => {
      const bulan = i + 1
      const jatuhTempo = new Date(tglCair)
      jatuhTempo.setMonth(jatuhTempo.getMonth() + bulan)

      return {
        pinjamanId: parsed.pinjamanId,
        angsuranKe: bulan,
        jatuhTempo,
        pokok: Number(pinjaman.angsuranPokok),
        jasa: Number(pinjaman.angsuranJasa),
        total: Number(pinjaman.angsuranTotal),
        status: "BELUM_LUNAS" as const,
      }
    })

    await tx.angsuran.createMany({ data: angsuranData })

    await buatJurnal(tx, {
      tanggal: tglCair,
      keterangan: `Pencairan Pinjaman ${pinjaman.id.slice(0, 8)}`,
      entries: [
        { akunKode: COA_PIUTANG_PINJAMAN, debit: Number(pinjaman.jumlah), kredit: 0 },
        { akunKode: COA_KAS, debit: 0, kredit: Number(pinjaman.jumlah) },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "DISBURSE",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "DICAIKKAN", jumlah: Number(pinjaman.jumlah) },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function bayarAngsuran(input: z.infer<typeof bayarAngsuranSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = bayarAngsuranSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({
    where: { id: parsed.pinjamanId },
    include: { angsuran: { where: { status: "BELUM_LUNAS" }, orderBy: { angsuranKe: "asc" } } },
  })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status === "LUNAS") throw new Error("Pinjaman sudah lunas")

  const nextAngsuran = pinjaman.angsuran[0]
  if (!nextAngsuran) throw new Error("Semua angsuran sudah lunas")

  const isLastAngsuran = pinjaman.angsuran.length === 1
  const pokok = isLastAngsuran ? Number(pinjaman.sisaPinjaman) : Number(nextAngsuran.pokok)
  const jasa = Number(nextAngsuran.jasa)
  const denda = parsed.nominal > pokok + jasa ? Number((parsed.nominal - pokok - jasa).toFixed(2)) : 0
  const sisaPinjamanSetelah = Number(pinjaman.sisaPinjaman) - pokok
  const isLunas = sisaPinjamanSetelah <= 0

  const tglBayar = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.angsuran.update({
      where: { id: nextAngsuran.id },
      data: {
        tglBayar,
        denda,
        total: pokok + jasa + denda,
        status: "LUNAS",
      },
    })

    await tx.pinjaman.update({
      where: { id: parsed.pinjamanId },
      data: {
        sisaPinjaman: Math.max(0, sisaPinjamanSetelah),
        status: isLunas ? "LUNAS" : pinjaman.status,
      },
    })

    const entries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    const totalBayar = pokok + jasa + denda
    if (totalBayar > 0) {
      entries.push({ akunKode: COA_KAS, debit: totalBayar, kredit: 0 })
    }
    if (pokok > 0) {
      entries.push({ akunKode: COA_PIUTANG_PINJAMAN, debit: 0, kredit: pokok })
    }
    if (jasa > 0) {
      entries.push({ akunKode: COA_PENDAPATAN_JASA, debit: 0, kredit: jasa })
    }
    if (denda > 0) {
      entries.push({ akunKode: COA_PENDAPATAN_DENDA, debit: 0, kredit: denda })
    }

    if (entries.length > 0) {
      await buatJurnal(tx, {
        tanggal: tglBayar,
        keterangan: `Bayar Angsuran #${nextAngsuran.angsuranKe} Pinjaman ${parsed.pinjamanId.slice(0, 8)}`,
        entries,
        createdById: session.user.id,
      })
    }
  })

  await catatLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "ANGSURAN",
    entityId: nextAngsuran.id,
    newValue: { angsuranKe: nextAngsuran.angsuranKe, pokok, jasa, denda, isLunas },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function hapusPinjaman(input: z.infer<typeof hapusPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = hapusPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status === "LUNAS") throw new Error("Pinjaman lunas tidak bisa dihapus")

  await prisma.pinjaman.update({
    where: { id: parsed.pinjamanId },
    data: { status: "GAGAL" },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "GAGAL" },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function getJenisPinjamanList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.jenisPinjaman.findMany({
    orderBy: { nama: "asc" },
  })

  return raw.map((j) => ({
    id: j.id,
    nama: j.nama,
    bunga: Number(j.bunga),
    keterangan: j.keterangan,
  }))
}
