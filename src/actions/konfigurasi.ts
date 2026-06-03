"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { catatLog } from "@/lib/audit"
import { invalidateKonfigCache } from "@/lib/konfig"

export async function getKonfigList() {
  const session = await auth()
  if (!session?.user) return []

  const raw = await prisma.konfigurasi.findMany({
    orderBy: { key: "asc" },
  })

  return raw.map((k) => ({
    id: k.id,
    key: k.key,
    value: k.value,
    tipeData: k.tipeData,
    keterangan: k.keterangan,
  }))
}

export async function updateKonfig(key: string, value: string, tipeData?: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.konfigurasi.findUnique({ where: { key } })

  await prisma.konfigurasi.upsert({
    where: { key },
    update: { value },
    create: { key, value, tipeData: tipeData ?? "STRING" },
  })

  invalidateKonfigCache()

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "KONFIGURASI",
    entityId: key,
    oldValue: { key, value: existing?.value },
    newValue: { key, value },
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

export async function getAkunList(tipe?: string) {
  const session = await auth()
  if (!session?.user) return []

  const where: Record<string, unknown> = {}
  if (tipe && tipe !== "SEMUA") where.tipe = tipe

  const raw = await prisma.akun.findMany({
    where,
    orderBy: { kode: "asc" },
  })

  return raw.map((a) => ({
    id: a.id,
    kode: a.kode,
    nama: a.nama,
    tipe: a.tipe,
    saldoNormal: a.saldoNormal,
    isActive: a.isActive,
  }))
}

export async function createAkun(data: {
  kode: string
  nama: string
  tipe: "ASET" | "LIABILITAS" | "EKUITAS" | "PENDAPATAN" | "BEBAN"
  saldoNormal: "DEBIT" | "KREDIT"
}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.akun.findUnique({ where: { kode: data.kode } })
  if (existing) throw new Error("Kode akun sudah ada")

  const akun = await prisma.akun.create({
    data: {
      kode: data.kode,
      nama: data.nama,
      tipe: data.tipe,
      saldoNormal: data.saldoNormal,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "AKUN",
    entityId: akun.id,
    newValue: { kode: data.kode, nama: data.nama, tipe: data.tipe },
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

export async function toggleAkunActive(akunId: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const akun = await prisma.akun.findUnique({ where: { id: akunId } })
  if (!akun) throw new Error("Akun tidak ditemukan")

  await prisma.akun.update({
    where: { id: akunId },
    data: { isActive: !akun.isActive },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "AKUN",
    entityId: akunId,
    oldValue: { isActive: akun.isActive },
    newValue: { isActive: !akun.isActive },
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true, isActive: !akun.isActive }
}

// ─── General Info ────────────────────────────────────────

export async function getGeneralInfo() {
  const session = await auth()
  if (!session?.user) return null

  const info = await prisma.generalInfo.findFirst()
  if (!info) return null

  return {
    id: info.id,
    namaKoperasi: info.namaKoperasi,
    alamat: info.alamat,
    noAhu: info.noAhu,
    logo: info.logo,
    website: info.website,
  }
}

export async function updateGeneralInfo(data: {
  namaKoperasi: string
  alamat?: string | null
  noAhu?: string | null
  logo?: string | null
  website?: string | null
}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.generalInfo.findFirst()
  if (existing) {
    await prisma.generalInfo.update({
      where: { id: existing.id },
      data,
    })
  } else {
    await prisma.generalInfo.create({ data: { ...data, id: undefined } })
  }

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "GENERAL_INFO",
    entityId: existing?.id ?? "new",
    newValue: data,
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

// ─── Jenis Pinjaman ──────────────────────────────────────

export async function getJenisPinjamanList() {
  const session = await auth()
  if (!session?.user) return []

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

export async function createJenisPinjaman(data: { nama: string; bunga: number; keterangan?: string | null }) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.jenisPinjaman.findUnique({ where: { nama: data.nama } })
  if (existing) throw new Error("Nama jenis pinjaman sudah ada")

  const created = await prisma.jenisPinjaman.create({
    data: {
      nama: data.nama,
      bunga: data.bunga,
      keterangan: data.keterangan || null,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "JENIS_PINJAMAN",
    entityId: created.id,
    newValue: data,
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

export async function updateJenisPinjaman(id: string, data: { nama: string; bunga: number; keterangan?: string | null }) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  await prisma.jenisPinjaman.update({
    where: { id },
    data: {
      nama: data.nama,
      bunga: data.bunga,
      keterangan: data.keterangan || null,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "JENIS_PINJAMAN",
    entityId: id,
    newValue: data,
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

export async function deleteJenisPinjaman(id: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const used = await prisma.pinjaman.count({ where: { jenisPinjamanId: id } })
  if (used > 0) throw new Error(`Tidak bisa dihapus, ${used} pinjaman menggunakan jenis ini`)

  await prisma.jenisPinjaman.delete({ where: { id } })

  await catatLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "JENIS_PINJAMAN",
    entityId: id,
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

// ─── Jenis Simpanan ──────────────────────────────────────

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
    isActive: j.isActive,
    urutan: j.urutan,
  }))
}

export async function createJenisSimpanan(data: {
  kode: string
  nama: string
  minimalSetoran: number
  keterangan?: string | null
}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.jenisSimpanan.findUnique({ where: { kode: data.kode } })
  if (existing) throw new Error("Kode jenis simpanan sudah ada")

  const created = await prisma.jenisSimpanan.create({
    data: {
      kode: data.kode,
      nama: data.nama,
      minimalSetoran: data.minimalSetoran,
      keterangan: data.keterangan || null,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "JENIS_SIMPANAN",
    entityId: created.id,
    newValue: data,
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

export async function updateJenisSimpanan(id: string, data: {
  kode: string
  nama: string
  minimalSetoran: number
  keterangan?: string | null
}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  await prisma.jenisSimpanan.update({
    where: { id },
    data: {
      kode: data.kode,
      nama: data.nama,
      minimalSetoran: data.minimalSetoran,
      keterangan: data.keterangan || null,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "JENIS_SIMPANAN",
    entityId: id,
    newValue: data,
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true }
}

export async function toggleJenisSimpananActive(id: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const jenis = await prisma.jenisSimpanan.findUnique({ where: { id } })
  if (!jenis) throw new Error("Jenis simpanan tidak ditemukan")

  await prisma.jenisSimpanan.update({
    where: { id },
    data: { isActive: !jenis.isActive },
  })

  revalidatePath("/pengurus/konfigurasi")
  return { success: true, isActive: !jenis.isActive }
}
