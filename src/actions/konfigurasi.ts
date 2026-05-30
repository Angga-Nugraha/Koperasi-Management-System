"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { catatLog } from "@/lib/audit"

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

export async function updateKonfig(key: string, value: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.konfigurasi.findUnique({ where: { key } })
  if (!existing) throw new Error("Konfigurasi tidak ditemukan")

  const oldValue = existing.value

  await prisma.konfigurasi.update({
    where: { key },
    data: { value },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "KONFIGURASI",
    entityId: key,
    oldValue: { key, value: oldValue },
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
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
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
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
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
