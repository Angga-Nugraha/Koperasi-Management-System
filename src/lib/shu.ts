import { prisma } from "@/lib/prisma"

export type IndikatorSHUData = {
  id: string
  kode: string
  nama: string
  persentase: number
  kelompok: string
  akunId: string | null
  urutan: number
  isActive: boolean
}

export async function getIndikatorSHU(): Promise<IndikatorSHUData[]> {
  const rows = await prisma.indikatorSHU.findMany({
    orderBy: { urutan: "asc" },
  })
  return rows.map((r) => ({
    id: r.id,
    kode: r.kode,
    nama: r.nama,
    persentase: Number(r.persentase),
    kelompok: r.kelompok,
    akunId: r.akunId,
    urutan: r.urutan,
    isActive: r.isActive,
  }))
}

export async function saveIndikatorSHU(items: Array<{
  kode: string
  nama: string
  persentase: number
  kelompok: string
  akunId: string | null
  urutan: number
}>) {
  const total = items.reduce((a, b) => a + b.persentase, 0)
  if (Math.abs(total - 100) > 0.01) throw new Error("Total persentase harus 100%")

  const kodes = items.map((i) => i.kode)

  await prisma.$transaction(async (tx) => {
    await tx.alokasiSHU.deleteMany({
      where: { indikator: { kode: { notIn: kodes } } },
    })
    await tx.indikatorSHU.deleteMany({
      where: { kode: { notIn: kodes } },
    })

    for (const item of items) {
      await tx.indikatorSHU.upsert({
        where: { kode: item.kode },
        create: item,
        update: { ...item },
      })
    }
  })
}

export async function deleteIndikatorSHU(kode: string) {
  await prisma.indikatorSHU.delete({ where: { kode } })
}

export async function getTotalPendapatanBeban(tahun: number) {
  const mulai = new Date(`${tahun}-01-01T00:00:00+07:00`)
  const selesai = new Date(`${tahun + 1}-01-01T00:00:00+07:00`)

  const detail = await prisma.detailJurnal.findMany({
    where: {
      jurnal: {
        tanggal: { gte: mulai, lt: selesai },
      },
    },
    include: { akun: true },
  })

  let totalPendapatan = 0
  let totalBeban = 0

  for (const d of detail) {
    if (d.akun.tipe === "PENDAPATAN") {
      totalPendapatan += Number(d.kredit) - Number(d.debit)
    }
    if (d.akun.tipe === "BEBAN") {
      totalBeban += Number(d.debit) - Number(d.kredit)
    }
  }

  return {
    totalPendapatan: Math.round(totalPendapatan * 100) / 100,
    totalBeban: Math.round(totalBeban * 100) / 100,
    totalSHU: Math.round((totalPendapatan - totalBeban) * 100) / 100,
  }
}

export async function getSaldoPerAnggota() {
  const simpanan = await prisma.simpanan.findMany({
    select: { anggotaId: true, saldo: true },
  })

  const perAnggota = new Map<string, number>()
  for (const s of simpanan) {
    perAnggota.set(s.anggotaId, (perAnggota.get(s.anggotaId) ?? 0) + Number(s.saldo))
  }

  let total = 0
  for (const v of perAnggota.values()) total += v

  return { perAnggota, totalSimpanan: Math.round(total * 100) / 100 }
}

export async function getTotalAngsuranAnggota(tahun: number) {
  const mulai = new Date(`${tahun}-01-01T00:00:00+07:00`)
  const selesai = new Date(`${tahun + 1}-01-01T00:00:00+07:00`)

  const angsuran = await prisma.angsuran.findMany({
    where: {
      tglBayar: { gte: mulai, lt: selesai },
      status: "LUNAS",
    },
    include: {
      pinjaman: { select: { anggotaId: true } },
    },
  })

  const perAnggota = new Map<string, number>()
  for (const a of angsuran) {
    const id = a.pinjaman.anggotaId
    perAnggota.set(id, (perAnggota.get(id) ?? 0) + Number(a.pokok))
  }

  let total = 0
  for (const v of perAnggota.values()) total += v

  return { perAnggota, total: Math.round(total * 100) / 100 }
}

export async function hitungSHU(tahun: number) {
  const keuangan = await getTotalPendapatanBeban(tahun)

  const indikator = (await getIndikatorSHU()).filter((i) => i.isActive)
  if (indikator.length === 0) throw new Error("Belum ada indikator SHU yang aktif")

  const shuBersih = Math.max(0, keuangan.totalSHU)

  const anggotaIndikator = indikator.filter((i) => i.kelompok === "ANGGOTA")
  const { totalSimpanan, perAnggota: saldoPerAnggota } = await getSaldoPerAnggota()
  const totalAngsuran = await getTotalAngsuranAnggota(tahun)

  const anggotaList = await prisma.anggota.findMany({
    where: { status: "AKTIF" },
    select: { id: true, nama: true, noAnggota: true },
  })

  const perAnggota: Array<{
    anggotaId: string
    noAnggota: string
    nama: string
    jasaModal: number
    jasaUsaha: number
    total: number
  }> = []

  for (const anggota of anggotaList) {
    const saldo = saldoPerAnggota.get(anggota.id) ?? 0
    const angsuranPokok = totalAngsuran.perAnggota.get(anggota.id) ?? 0

    let jm = 0
    let ju = 0

    for (const ind of anggotaIndikator) {
      const dana = shuBersih * (ind.persentase / 100)
      if (ind.kode === "JM") {
        jm = totalSimpanan > 0 ? dana * (saldo / totalSimpanan) : 0
      } else if (ind.kode === "JU") {
        ju = totalAngsuran.total > 0 ? dana * (angsuranPokok / totalAngsuran.total) : 0
      }
    }

    const total = Math.round((jm + ju) * 100) / 100

    perAnggota.push({
      anggotaId: anggota.id,
      noAnggota: anggota.noAnggota,
      nama: anggota.nama,
      jasaModal: Math.round(jm * 100) / 100,
      jasaUsaha: Math.round(ju * 100) / 100,
      total,
    })
  }

  const alokasiMap: Record<string, { persentase: number; nominal: number }> = {}
  for (const ind of indikator) {
    const nominal = shuBersih * (ind.persentase / 100)
    alokasiMap[ind.kode] = {
      persentase: ind.persentase,
      nominal: Math.round(nominal * 100) / 100,
    }
  }

  return {
    keuangan,
    indikator,
    alokasi: alokasiMap,
    perAnggota,
    totalAnggota: anggotaList.length,
  }
}
