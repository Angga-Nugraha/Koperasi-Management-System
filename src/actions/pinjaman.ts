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
      include: { anggota: { select: { id: true, nama: true, noAnggota: true } } },
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
      angsuran: { orderBy: { angsuranKe: "asc" } },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    anggotaId: raw.anggotaId,
    noAnggota: raw.anggota.noAnggota,
    namaAnggota: raw.anggota.nama,
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
    include: { angsuran: { orderBy: { angsuranKe: "asc" } } },
    orderBy: { createdAt: "desc" },
  })

  return raw.map((p) => ({
    id: p.id,
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

  const angsuranPokok = Number((parsed.jumlah / parsed.tenor).toFixed(2))
  const angsuranJasa = Number((parsed.jumlah * (parsed.bunga / 100)).toFixed(2))
  const angsuranTotal = Number((angsuranPokok + angsuranJasa).toFixed(2))

  await prisma.pinjaman.create({
    data: {
      anggotaId: parsed.anggotaId,
      jumlah: parsed.jumlah,
      tenor: parsed.tenor,
      bunga: parsed.bunga,
      angsuranPokok,
      angsuranJasa,
      angsuranTotal,
      sisaPinjaman: 0,
      status: "PENGAJUAN",
      tglPengajuan: new Date(),
      keterangan: parsed.keterangan || null,
    },
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

  const pokok = Number(nextAngsuran.pokok)
  const jasa = Number(nextAngsuran.jasa)
  const denda = parsed.nominal > pokok + jasa ? Number((parsed.nominal - pokok - jasa).toFixed(2)) : 0
  const sisaPinjamanSetelah = Number(pinjaman.sisaPinjaman) - pokok
  const isLunas = sisaPinjamanSetelah <= 0

  await prisma.$transaction(async (tx) => {
    await tx.angsuran.update({
      where: { id: nextAngsuran.id },
      data: {
        tglBayar: new Date(),
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

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}
