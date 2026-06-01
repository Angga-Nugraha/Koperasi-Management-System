"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { setorSimpananSchema, tarikSimpananSchema, penutupanSimpananSchema } from "@/lib/validations/simpanan"
import { z } from "zod"
import { buatJurnal, COA_KAS, getSimpananAkun } from "@/lib/jurnal"
import { catatLog } from "@/lib/audit"

export async function getJenisSimpananList() {
  const session = await auth()
  if (!session?.user) return []

  const raw = await prisma.jenisSimpanan.findMany({
    orderBy: { urutan: "asc" },
  })

  return raw.map((j) => ({
    id: j.id,
    kode: j.kode,
    nama: j.nama,
    minimalSetoran: Number(j.minimalSetoran),
    keterangan: j.keterangan,
  }))
}

export async function getSimpananList(params: {
  search?: string
  jenisSimpananId?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { search, jenisSimpananId, page = 1, pageSize = 15 } = params

  const where: Record<string, unknown> = {}
  if (jenisSimpananId) where.jenisSimpananId = jenisSimpananId
  if (search) {
    where.anggota = { nama: { contains: search } }
  }

  const [raw, total] = await Promise.all([
    prisma.simpanan.findMany({
      where,
      include: {
        anggota: { select: { id: true, nama: true, noAnggota: true } },
        jenisSimpanan: { select: { kode: true, nama: true } },
      },
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
    jenisSimpananId: s.jenisSimpananId,
    jenisKode: s.jenisSimpanan.kode,
    jenisNama: s.jenisSimpanan.nama,
    saldo: Number(s.saldo),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getSimpananAnggota(anggotaId: string) {
  const raw = await prisma.simpanan.findMany({
    where: { anggotaId },
    include: { jenisSimpanan: { select: { kode: true, nama: true } } },
    orderBy: { jenisSimpanan: { urutan: "asc" } },
  })

  return raw.map((s) => ({
    id: s.id,
    jenisSimpananId: s.jenisSimpananId,
    jenisKode: s.jenisSimpanan.kode,
    jenisNama: s.jenisSimpanan.nama,
    saldo: Number(s.saldo),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))
}

export async function getMutasiAnggota(
  anggotaId: string,
  params: { jenisSimpananId?: string; page?: number; pageSize?: number }
) {
  const { jenisSimpananId, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = { anggotaId }
  if (jenisSimpananId) where.jenisSimpananId = jenisSimpananId

  const [raw, total] = await Promise.all([
    prisma.transaksiSimpanan.findMany({
      where,
      include: { jenisSimpanan: { select: { kode: true, nama: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaksiSimpanan.count({ where }),
  ])

  const data = raw.map((t) => ({
    id: t.id,
    jenisSimpananId: t.jenisSimpananId,
    jenisKode: t.jenisSimpanan.kode,
    jenisNama: t.jenisSimpanan.nama,
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
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setorSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const jenis = await prisma.jenisSimpanan.findUnique({ where: { id: parsed.jenisSimpananId } })
  if (!jenis) throw new Error("Jenis simpanan tidak ditemukan")

  if (parsed.nominal < Number(jenis.minimalSetoran)) {
    throw new Error(`Setoran ${jenis.nama} minimal Rp${Number(jenis.minimalSetoran).toLocaleString("id-ID")}`)
  }

  await prisma.$transaction(async (tx) => {
    const simpanan = await tx.simpanan.upsert({
      where: { anggotaId_jenisSimpananId: { anggotaId: parsed.anggotaId, jenisSimpananId: parsed.jenisSimpananId } },
      create: {
        anggotaId: parsed.anggotaId,
        jenisSimpananId: parsed.jenisSimpananId,
        saldo: parsed.nominal,
      },
      update: {
        saldo: { increment: parsed.nominal },
      },
    })

    await tx.transaksiSimpanan.create({
      data: {
        anggotaId: parsed.anggotaId,
        jenisSimpananId: parsed.jenisSimpananId,
        tipe: "SETORAN",
        nominal: parsed.nominal,
        saldoSetelah: Number(simpanan.saldo),
        keterangan: parsed.keterangan || null,
      },
    })

    const akunSimpanan = getSimpananAkun(jenis.kode)
    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Setoran ${jenis.nama} ${anggota.noAnggota}`,
      entries: [
        { akunKode: COA_KAS, debit: parsed.nominal, kredit: 0 },
        { akunKode: akunSimpanan, debit: 0, kredit: parsed.nominal },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SETORAN_SIMPANAN",
    entityId: parsed.anggotaId,
    newValue: { jenisSimpananId: parsed.jenisSimpananId, nominal: parsed.nominal },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return { success: true }
}

export async function tarikSimpanan(input: z.infer<typeof tarikSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = tarikSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const jenis = await prisma.jenisSimpanan.findUnique({ where: { id: parsed.jenisSimpananId } })
  if (!jenis) throw new Error("Jenis simpanan tidak ditemukan")

  const simpanan = await prisma.simpanan.findUnique({
    where: { anggotaId_jenisSimpananId: { anggotaId: parsed.anggotaId, jenisSimpananId: parsed.jenisSimpananId } },
  })
  if (!simpanan) throw new Error("Simpanan tidak ditemukan")
  if (Number(simpanan.saldo) < parsed.nominal) throw new Error("Saldo tidak mencukupi")

  await prisma.$transaction(async (tx) => {
    await tx.simpanan.update({
      where: { anggotaId_jenisSimpananId: { anggotaId: parsed.anggotaId, jenisSimpananId: parsed.jenisSimpananId } },
      data: { saldo: { decrement: parsed.nominal } },
    })

    await tx.transaksiSimpanan.create({
      data: {
        anggotaId: parsed.anggotaId,
        jenisSimpananId: parsed.jenisSimpananId,
        tipe: "PENARIKAN",
        nominal: parsed.nominal,
        saldoSetelah: Number(simpanan.saldo) - parsed.nominal,
        keterangan: parsed.keterangan || null,
      },
    })

    const akunSimpanan = getSimpananAkun(jenis.kode)
    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Penarikan ${jenis.nama} ${anggota.noAnggota}`,
      entries: [
        { akunKode: akunSimpanan, debit: parsed.nominal, kredit: 0 },
        { akunKode: COA_KAS, debit: 0, kredit: parsed.nominal },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PENARIKAN_SIMPANAN",
    entityId: parsed.anggotaId,
    newValue: { jenisSimpananId: parsed.jenisSimpananId, nominal: parsed.nominal },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return { success: true }
}

export async function penutupanSimpanan(input: z.infer<typeof penutupanSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = penutupanSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")
  if (anggota.status === "KELUAR") throw new Error("Anggota sudah keluar")

  const jenisPokokWajib = await prisma.jenisSimpanan.findMany({
    where: { kode: { in: ["POKOK", "WAJIB"] } },
  })
  const jenisIds = jenisPokokWajib.map((j) => j.id)

  const simpananList = await prisma.simpanan.findMany({
    where: { anggotaId: parsed.anggotaId, jenisSimpananId: { in: jenisIds } },
    include: { jenisSimpanan: true },
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
          jenisSimpananId: simpanan.jenisSimpananId,
          tipe: "PENARIKAN",
          nominal: saldo,
          saldoSetelah: 0,
          keterangan: parsed.keterangan || "Penutupan keanggotaan",
        },
      })

      const akunSimpanan = getSimpananAkun(simpanan.jenisSimpanan.kode)
      await buatJurnal(tx, {
        tanggal: new Date(),
        keterangan: `Penutupan ${simpanan.jenisSimpanan.nama} ${anggota.noAnggota}`,
        entries: [
          { akunKode: akunSimpanan, debit: saldo, kredit: 0 },
          { akunKode: COA_KAS, debit: 0, kredit: saldo },
        ],
        createdById: session.user.id,
      })
    }

    await tx.anggota.update({
      where: { id: parsed.anggotaId },
      data: { status: "KELUAR" },
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PENUTUPAN_SIMPANAN",
    entityId: parsed.anggotaId,
    newValue: { status: "KELUAR" },
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
