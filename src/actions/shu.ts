"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { hitungSHU, getIndikatorSHU, saveIndikatorSHU, deleteIndikatorSHU } from "@/lib/shu"
import { catatLog } from "@/lib/audit"

export async function getSHUList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.sHU.findMany({ orderBy: { tahun: "desc" } })
  return raw.map((s) => ({
    id: s.id,
    tahun: s.tahun,
    totalSHU: Number(s.totalSHU),
    status: s.status,
  }))
}

export async function getSHUByTahun(tahun: number, page = 1, pageSize = 20) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.sHU.findUnique({
    where: { tahun },
    include: {
      alokasi: {
        include: { indikator: { select: { nama: true, kode: true } } },
      },
    },
  })

  if (!raw) return null

  const [shuAnggota, total] = await Promise.all([
    prisma.sHUAnggota.findMany({
      where: { shuId: raw.id },
      include: { anggota: { select: { noAnggota: true, nama: true } } },
      orderBy: { total: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.sHUAnggota.count({ where: { shuId: raw.id } }),
  ])

  return {
    id: raw.id,
    tahun: raw.tahun,
    totalSHU: Number(raw.totalSHU),
    status: raw.status,
    alokasi: raw.alokasi.map((a) => ({
      pos: a.pos,
      indikatorId: a.indikatorId,
      indikatorNama: a.indikator.nama,
      persentase: Number(a.persentase),
      nominal: Number(a.nominal),
    })),
    shuAnggota: shuAnggota.map((a) => ({
      anggotaId: a.anggotaId,
      noAnggota: a.anggota.noAnggota,
      nama: a.anggota.nama,
      jasaModal: Number(a.jasaModal),
      jasaUsaha: Number(a.jasaUsaha),
      total: Number(a.total),
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function generateSHU(tahun: number) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const existing = await prisma.sHU.findUnique({ where: { tahun } })
  if (existing) throw new Error(`SHU tahun ${tahun} sudah ada`)

  const hasil = await hitungSHU(tahun)
  if (hasil.perAnggota.length === 0) throw new Error("Tidak ada anggota aktif untuk perhitungan SHU")

  await prisma.$transaction(async (tx) => {
    await tx.sHU.create({
      data: {
        tahun,
        totalSHU: hasil.keuangan.totalSHU,
        status: "DRAFT",
        alokasi: {
          create: hasil.indikator.map((ind) => ({
            indikatorId: ind.id,
            pos: ind.kode,
            persentase: ind.persentase,
            nominal: hasil.alokasi[ind.kode]?.nominal ?? 0,
          })),
        },
        shuAnggota: {
          create: hasil.perAnggota.map((a) => ({
            anggotaId: a.anggotaId,
            jasaModal: a.jasaModal,
            jasaUsaha: a.jasaUsaha,
            total: a.total,
          })),
        },
      },
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SHU",
    newValue: { tahun, totalSHU: hasil.keuangan.totalSHU, anggota: hasil.totalAnggota },
  })

  revalidatePath("/pengurus/shu")
  return { success: true }
}

export async function getSHUAnggota(anggotaId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const userId = anggotaId ?? (session.user.role === "ANGGOTA" ? session.user.anggotaId : null)
  if (!userId && !anggotaId) throw new Error("Anggota tidak ditemukan")

  const where: Record<string, unknown> = {}
  if (anggotaId) where.anggotaId = anggotaId
  else if (userId) where.anggotaId = userId

  const raw = await prisma.sHUAnggota.findMany({
    where,
    include: {
      shu: { select: { tahun: true, totalSHU: true, status: true } },
    },
    orderBy: { shu: { tahun: "desc" } },
  })

  return raw.map((s) => ({
    tahun: s.shu.tahun,
    totalSHU: Number(s.shu.totalSHU),
    status: s.shu.status,
    jasaModal: Number(s.jasaModal),
    jasaUsaha: Number(s.jasaUsaha),
    total: Number(s.total),
  }))
}

export async function getIndikatorSHUList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  return getIndikatorSHU()
}

export async function saveAllIndikatorSHU(data: Array<{
  kode: string
  nama: string
  persentase: number
  kelompok: string
  akunId: string | null
  urutan: number
}>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  await saveIndikatorSHU(data)
  revalidatePath("/pengurus/shu/konfigurasi")
  return { success: true }
}

export async function removeIndikatorSHU(kode: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  await deleteIndikatorSHU(kode)
  revalidatePath("/pengurus/shu/konfigurasi")
  return { success: true }
}

export async function hapusSHU(tahun: number) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const shu = await prisma.sHU.findUnique({ where: { tahun } })
  if (!shu) throw new Error("SHU tidak ditemukan")
  if (shu.status === "FINAL") throw new Error("SHU FINAL tidak bisa dihapus")

  await prisma.$transaction(async (tx) => {
    await tx.alokasiSHU.deleteMany({ where: { shuId: shu.id } })
    await tx.sHUAnggota.deleteMany({ where: { shuId: shu.id } })
    await tx.sHU.delete({ where: { id: shu.id } })
  })

  await catatLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "SHU",
    newValue: { tahun },
  })

  revalidatePath("/pengurus/shu")
  return { success: true }
}

export async function exportSHUExcel(tahun: number) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const ExcelJS = await import("exceljs")

  const raw = await prisma.sHU.findUnique({
    where: { tahun },
    include: {
      alokasi: {
        include: { indikator: { select: { nama: true } } },
      },
      shuAnggota: {
        include: { anggota: { select: { noAnggota: true, nama: true } } },
        orderBy: { total: "desc" },
      },
    },
  })

  if (!raw) throw new Error("SHU tidak ditemukan")

  const wb = new ExcelJS.Workbook()

  const ws1 = wb.addWorksheet("Alokasi SHU")
  ws1.columns = [
    { header: "Pos", key: "pos", width: 30 },
    { header: "Persentase", key: "persen", width: 15 },
    { header: "Nominal", key: "nominal", width: 20 },
  ]
  ws1.getRow(1).font = { bold: true }
  ws1.addRow({ pos: "Total SHU", persen: 100, nominal: Number(raw.totalSHU) }).font = { bold: true }
  for (const a of raw.alokasi) {
    ws1.addRow({ pos: `${a.indikator.nama} (${a.pos})`, persen: `${Number(a.persentase)}%`, nominal: Number(a.nominal) })
  }

  const ws2 = wb.addWorksheet("SHU Anggota")
  ws2.columns = [
    { header: "No Anggota", key: "noAnggota", width: 15 },
    { header: "Nama", key: "nama", width: 25 },
    { header: "Jasa Modal", key: "jm", width: 18 },
    { header: "Jasa Usaha", key: "ju", width: 18 },
    { header: "Total", key: "total", width: 18 },
  ]
  ws2.getRow(1).font = { bold: true }
  for (const a of raw.shuAnggota) {
    ws2.addRow({
      noAnggota: a.anggota.noAnggota,
      nama: a.anggota.nama,
      jm: Number(a.jasaModal),
      ju: Number(a.jasaUsaha),
      total: Number(a.total),
    })
  }

  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>
}
