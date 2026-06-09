"use server"

import { prisma } from "@/lib/prisma"
import { kepengurusanSchema, jabatanSchema } from "@/lib/validations/kepengurusan"
import { z } from "zod"
import { assertRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { catatLog } from "@/lib/audit"

export type StrukturItem = {
  id: string
  jabatan: string
  tipe: string
  urutan: number
  anggotaId: string | null
  anggota: {
    id: string
    nama: string
    noAnggota: string
    nik: string
  } | null
}

export async function getKepengurusanList(): Promise<StrukturItem[]> {
  return prisma.kepengurusan.findMany({
    include: {
      anggota: { select: { id: true, nama: true, noAnggota: true, nik: true } },
    },
    orderBy: { urutan: "asc" },
  })
}

export async function getAnggotaListForSelect() {
  return prisma.anggota.findMany({
    where: { status: "AKTIF" },
    select: { id: true, nama: true, noAnggota: true, nik: true },
    orderBy: { nama: "asc" },
  })
}

export async function upsertKepengurusan(input: z.infer<typeof kepengurusanSchema>) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const parsed = kepengurusanSchema.parse(input)

  const existing = await prisma.kepengurusan.findUnique({
    where: { jabatan: parsed.jabatan },
  })
  if (!existing) throw new Error("Jabatan tidak ditemukan, buat jabatan terlebih dahulu")

  const anggota = await prisma.anggota.findUnique({
    where: { id: parsed.anggotaId },
    select: { nama: true, noAnggota: true },
  })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  await prisma.kepengurusan.update({
    where: { id: existing.id },
    data: { anggotaId: parsed.anggotaId },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "KEPENGURUSAN",
    entityId: existing.id,
    oldValue: { anggotaId: existing.anggotaId },
    newValue: { anggotaId: parsed.anggotaId, jabatan: parsed.jabatan, anggota: anggota.nama },
  })

  revalidatePath("/pengurus/struktur")
  return { success: true }
}

export async function tambahJabatan(input: z.infer<typeof jabatanSchema>) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")
  const parsed = jabatanSchema.parse(input)

  const existing = await prisma.kepengurusan.findUnique({
    where: { jabatan: parsed.jabatan },
  })
  if (existing) throw new Error(`Jabatan "${parsed.jabatan}" sudah ada`)

  const maxUrutan = await prisma.kepengurusan.aggregate({ _max: { urutan: true } })
  const urutan = (maxUrutan._max.urutan ?? 0) + 1

  await prisma.kepengurusan.create({
    data: { jabatan: parsed.jabatan, tipe: parsed.tipe, urutan },
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "KEPENGURUSAN",
    entityId: parsed.jabatan,
    newValue: { jabatan: parsed.jabatan, tipe: parsed.tipe },
  })

  revalidatePath("/pengurus/struktur")
  return { success: true }
}

export async function hapusJabatan(id: string) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const existing = await prisma.kepengurusan.findUnique({ where: { id } })
  if (!existing) throw new Error("Data tidak ditemukan")

  await prisma.kepengurusan.delete({ where: { id } })

  await catatLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "KEPENGURUSAN",
    entityId: existing.id,
    oldValue: { jabatan: existing.jabatan, anggotaId: existing.anggotaId },
  })

  revalidatePath("/pengurus/struktur")
  return { success: true }
}

export async function kosongkanJabatan(id: string) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  await prisma.kepengurusan.update({
    where: { id },
    data: { anggota: { disconnect: true } },
  })

  revalidatePath("/pengurus/struktur")
  return { success: true }
}
