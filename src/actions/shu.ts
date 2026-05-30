"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { hitungSHU, getAlokasiConfig, saveAlokasiConfig } from "@/lib/shu"
import { buatJurnal } from "@/lib/jurnal"
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

export async function getSHUByTahun(tahun: number) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.sHU.findUnique({
    where: { tahun },
    include: {
      alokasi: true,
      shuAnggota: {
        include: { anggota: { select: { noAnggota: true, nama: true } } },
        orderBy: { total: "desc" },
      },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    tahun: raw.tahun,
    totalSHU: Number(raw.totalSHU),
    status: raw.status,
    alokasi: raw.alokasi.map((a) => ({
      pos: a.pos,
      persentase: Number(a.persentase),
      nominal: Number(a.nominal),
    })),
    shuAnggota: raw.shuAnggota.map((a) => ({
      anggotaId: a.anggotaId,
      noAnggota: a.anggota.noAnggota,
      nama: a.anggota.nama,
      jasaModal: Number(a.jasaModal),
      jasaUsaha: Number(a.jasaUsaha),
      total: Number(a.total),
    })),
  }
}

export async function generateSHU(tahun: number) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
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
          create: [
            { pos: "JM", persentase: hasil.alokasi.jmPersen, nominal: hasil.alokasi.jmDana },
            { pos: "JU", persentase: hasil.alokasi.juPersen, nominal: hasil.alokasi.juDana },
            { pos: "CAD", persentase: hasil.alokasi.cadPersen, nominal: hasil.alokasi.cadDana },
            { pos: "PENGURUS", persentase: hasil.alokasi.pengurusPersen, nominal: hasil.alokasi.pengurusDana },
            { pos: "PENGAWAS", persentase: hasil.alokasi.pengawasPersen, nominal: hasil.alokasi.pengawasDana },
            { pos: "SOSIAL", persentase: hasil.alokasi.sosialPersen, nominal: hasil.alokasi.sosialDana },
          ],
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

export async function setujuiSHU(tahun: number) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const shu = await prisma.sHU.findUnique({
    where: { tahun },
    include: { alokasi: true },
  })
  if (!shu) throw new Error("SHU tidak ditemukan")
  if (shu.status !== "DRAFT") throw new Error("SHU sudah FINAL")

  const akunSHU = await prisma.akun.findFirst({ where: { kode: "3.1.2" } })
  const akunCadangan = await prisma.akun.findFirst({ where: { kode: "3.1.4" } })
  if (!akunSHU || !akunCadangan) throw new Error("Akun SHU atau Cadangan tidak ditemukan")

  await prisma.$transaction(async (tx) => {
    await tx.sHU.update({
      where: { id: shu.id },
      data: { status: "FINAL" },
    })

    const entries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    const totalNominal = Number(shu.totalSHU)

    // Debit SHU Tahun Berjalan, Kredit ke pos-pos alokasi
    entries.push({ akunKode: akunSHU.kode, debit: totalNominal, kredit: 0 })

    for (const a of shu.alokasi) {
      const nominal = Number(a.nominal)
      if (nominal <= 0) continue

      let akunKode: string | null = null
      switch (a.pos) {
        case "CAD": akunKode = akunCadangan.kode; break
        case "JM": {
          const akun = await tx.akun.findFirst({ where: { kode: "2.1.4" } })
          if (akun) akunKode = akun.kode
          break
        }
        case "SOSIAL": {
          const akun = await tx.akun.findFirst({ where: { kode: "2.2.1" } })
          if (akun) akunKode = akun.kode
          break
        }
      }
      if (akunKode) entries.push({ akunKode, debit: 0, kredit: nominal })
    }

    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Jurnal Penutup SHU Tahun ${tahun}`,
      entries,
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "SHU",
    newValue: { tahun, status: "FINAL" },
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

export async function getKonfigAlokasi() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  return getAlokasiConfig()
}

export async function updateKonfigAlokasi(data: {
  jmPersen: number
  juPersen: number
  cadPersen: number
  pengurusPersen: number
  pengawasPersen: number
  sosialPersen: number
}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  await saveAlokasiConfig(data)
  revalidatePath("/pengurus/shu/konfigurasi")
  return { success: true }
}

export async function exportSHUExcel(tahun: number) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const ExcelJS = await import("exceljs")

  const raw = await prisma.sHU.findUnique({
    where: { tahun },
    include: {
      alokasi: true,
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
    { header: "Pos", key: "pos", width: 20 },
    { header: "Persentase", key: "persen", width: 15 },
    { header: "Nominal", key: "nominal", width: 20 },
  ]
  ws1.getRow(1).font = { bold: true }
  ws1.addRow({ pos: "Total SHU", persen: 100, nominal: Number(raw.totalSHU) }).font = { bold: true }
  for (const a of raw.alokasi) {
    ws1.addRow({ pos: a.pos, persen: `${Number(a.persentase)}%`, nominal: Number(a.nominal) })
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
