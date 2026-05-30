"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { setorSimpananSchema, tarikSimpananSchema, penutupanSimpananSchema } from "@/lib/validations/simpanan"
import { z } from "zod"

export async function getSimpananList(params: {
  search?: string
  jenis?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { search, jenis, page = 1, pageSize = 15 } = params

  const where: Record<string, unknown> = {}
  if (jenis && jenis !== "SEMUA") where.jenis = jenis
  if (search) {
    where.anggota = { nama: { contains: search } }
  }

  const [raw, total] = await Promise.all([
    prisma.simpanan.findMany({
      where,
      include: { anggota: { select: { id: true, nama: true, noAnggota: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.simpanan.count({ where }),
  ])

  const data = raw.map((s) => ({
    id: s.id,
    anggotaId: s.anggotaId,
    noAnggota: s.anggota.noAnggota,
    namaAnggota: s.anggota.nama,
    jenis: s.jenis,
    saldo: Number(s.saldo),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getSimpananAnggota(anggotaId: string) {
  const raw = await prisma.simpanan.findMany({
    where: { anggotaId },
    orderBy: { jenis: "asc" },
  })

  return raw.map((s) => ({
    id: s.id,
    jenis: s.jenis,
    saldo: Number(s.saldo),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))
}

export async function getMutasiAnggota(
  anggotaId: string,
  params: { jenis?: string; page?: number; pageSize?: number }
) {
  const { jenis, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = { anggotaId }
  if (jenis && jenis !== "SEMUA") where.jenis = jenis

  const [raw, total] = await Promise.all([
    prisma.transaksiSimpanan.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaksiSimpanan.count({ where }),
  ])

  const data = raw.map((t) => ({
    id: t.id,
    jenis: t.jenis,
    tipe: t.tipe,
    nominal: Number(t.nominal),
    saldoSetelah: Number(t.saldoSetelah),
    keterangan: t.keterangan,
    createdAt: t.createdAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function setorSimpanan(input: z.infer<typeof setorSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setorSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const simpanan = await prisma.simpanan.upsert({
    where: { anggotaId_jenis: { anggotaId: parsed.anggotaId, jenis: parsed.jenis } },
    create: {
      anggotaId: parsed.anggotaId,
      jenis: parsed.jenis,
      saldo: parsed.nominal,
    },
    update: {
      saldo: { increment: parsed.nominal },
    },
  })

  await prisma.transaksiSimpanan.create({
    data: {
      anggotaId: parsed.anggotaId,
      jenis: parsed.jenis,
      tipe: "SETORAN",
      nominal: parsed.nominal,
      saldoSetelah: Number(simpanan.saldo),
      keterangan: parsed.keterangan || null,
    },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return { success: true }
}

export async function tarikSimpanan(input: z.infer<typeof tarikSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = tarikSimpananSchema.parse(input)

  const simpanan = await prisma.simpanan.findUnique({
    where: { anggotaId_jenis: { anggotaId: parsed.anggotaId, jenis: parsed.jenis } },
  })
  if (!simpanan) throw new Error("Simpanan tidak ditemukan")
  if (Number(simpanan.saldo) < parsed.nominal) throw new Error("Saldo tidak mencukupi")

  await prisma.simpanan.update({
    where: { anggotaId_jenis: { anggotaId: parsed.anggotaId, jenis: parsed.jenis } },
    data: { saldo: { decrement: parsed.nominal } },
  })

  await prisma.transaksiSimpanan.create({
    data: {
      anggotaId: parsed.anggotaId,
      jenis: parsed.jenis,
      tipe: "PENARIKAN",
      nominal: parsed.nominal,
      saldoSetelah: Number(simpanan.saldo) - parsed.nominal,
      keterangan: parsed.keterangan || null,
    },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return { success: true }
}

export async function penutupanSimpanan(input: z.infer<typeof penutupanSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = penutupanSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")
  if (anggota.status === "KELUAR") throw new Error("Anggota sudah keluar")

  const simpananList = await prisma.simpanan.findMany({
    where: { anggotaId: parsed.anggotaId, jenis: { in: ["POKOK", "WAJIB"] } },
  })

  if (simpananList.length === 0) throw new Error("Tidak ada simpanan pokok atau wajib")

  await prisma.$transaction(async (tx) => {
    for (const simpanan of simpananList) {
      const saldo = Number(simpanan.saldo)
      if (saldo <= 0) continue

      await tx.simpanan.update({
        where: { id: simpanan.id },
        data: { saldo: { decrement: saldo } },
      })

      await tx.transaksiSimpanan.create({
        data: {
          anggotaId: parsed.anggotaId,
          jenis: simpanan.jenis,
          tipe: "PENARIKAN",
          nominal: saldo,
          saldoSetelah: 0,
          keterangan: parsed.keterangan || "Penutupan keanggotaan",
        },
      })
    }

    await tx.anggota.update({
      where: { id: parsed.anggotaId },
      data: { status: "KELUAR" },
    })
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath("/pengurus/anggota")
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return { success: true }
}

export async function cariAnggota(query: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (!query || query.length < 1) return []

  const anggota = await prisma.anggota.findMany({
    where: {
      status: "AKTIF",
      OR: [
        { nama: { contains: query } },
        { noAnggota: { contains: query } },
      ],
    },
    select: { id: true, noAnggota: true, nama: true },
    take: 20,
    orderBy: { noAnggota: "asc" },
  })

  return anggota
}

export async function getAnggotaBasic(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const anggota = await prisma.anggota.findUnique({
    where: { id },
    select: { id: true, noAnggota: true, nama: true },
  })

  return anggota
}
