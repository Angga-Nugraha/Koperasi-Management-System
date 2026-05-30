"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardPengurus() {
  const totalAnggota = await prisma.anggota.count({ where: { status: "AKTIF" } })

  const totalSimpananAgg = await prisma.simpanan.aggregate({ _sum: { saldo: true } })
  const totalSimpanan = Number(totalSimpananAgg._sum.saldo ?? 0)

  const pinjamanOutstanding = await prisma.pinjaman.findMany({
    where: { status: { notIn: ["LUNAS", "DITOLAK"] } },
    select: { sisaPinjaman: true },
  })
  const totalPinjaman = pinjamanOutstanding.reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  const shuTerakhir = await prisma.sHU.findFirst({
    orderBy: { createdAt: "desc" },
    select: { totalSHU: true },
  })
  const totalSHU = Number(shuTerakhir?.totalSHU ?? 0)

  const transaksi6Bulan = await prisma.transaksiSimpanan.findMany({
    where: {
      createdAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
    },
    select: { nominal: true, tipe: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const chartData: Record<string, { setoran: number; penarikan: number }> = {}
  for (const t of transaksi6Bulan) {
    const month = t.createdAt.toLocaleString("id-ID", { month: "short", year: "2-digit" })
    if (!chartData[month]) chartData[month] = { setoran: 0, penarikan: 0 }
    if (t.tipe === "SETORAN") chartData[month].setoran += Number(t.nominal)
    else chartData[month].penarikan += Number(t.nominal)
  }

  const simpananChart = Object.entries(chartData).map(([bulan, data]) => ({
    bulan,
    setoran: data.setoran,
    penarikan: data.penarikan,
  }))

  const pinjamanPerStatus = await prisma.pinjaman.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { jumlah: true },
  })

  return {
    totalAnggota,
    totalSimpanan,
    totalPinjaman,
    totalSHU,
    simpananChart,
    pinjamanPerStatus: pinjamanPerStatus.map((p) => ({
      status: p.status,
      count: p._count.id,
      total: Number(p._sum.jumlah ?? 0),
    })),
  }
}

export async function getDashboardAnggota(anggotaId: string) {
  const simpanan = await prisma.simpanan.findMany({
    where: { anggotaId },
    include: { jenisSimpanan: { select: { kode: true, nama: true } } },
  })

  const pinjamanAktif = await prisma.pinjaman.findMany({
    where: { anggotaId, status: { notIn: ["LUNAS", "DITOLAK"] } },
    select: { sisaPinjaman: true, jumlah: true, status: true },
  })

  const shuAnggota = await prisma.sHUAnggota.findMany({
    where: { anggotaId },
    include: { shu: { select: { tahun: true } } },
    orderBy: { shu: { tahun: "desc" } },
    take: 1,
  })

  const totalSimpanan = simpanan.reduce((s, x) => s + Number(x.saldo), 0)
  const totalPinjaman = pinjamanAktif.reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  return {
    simpanan: simpanan.map((s) => ({
      kode: s.jenisSimpanan.kode,
      nama: s.jenisSimpanan.nama,
      saldo: Number(s.saldo),
    })),
    totalSimpanan,
    pinjamanAktif: pinjamanAktif.map((p) => ({
      sisaPinjaman: Number(p.sisaPinjaman),
      jumlah: Number(p.jumlah),
      status: p.status,
    })),
    totalPinjaman,
    shuDiterima: shuAnggota.length > 0 ? Number(shuAnggota[0]!.total) : 0,
  }
}

export async function getDashboardPengawas() {
  const totalAuditLog = await prisma.auditLog.count()

  const awalBulan = new Date()
  awalBulan.setDate(1)
  awalBulan.setHours(0, 0, 0, 0)

  const jurnalBulanIni = await prisma.jurnalUmum.count({
    where: { createdAt: { gte: awalBulan } },
  })

  const totalAnggota = await prisma.anggota.count({ where: { status: "AKTIF" } })

  const totalSimpananAgg = await prisma.simpanan.aggregate({ _sum: { saldo: true } })
  const totalSimpanan = Number(totalSimpananAgg._sum.saldo ?? 0)

  const pinjamanOutstanding = await prisma.pinjaman.findMany({
    where: { status: { notIn: ["LUNAS", "DITOLAK"] } },
    select: { sisaPinjaman: true },
  })
  const totalPinjaman = pinjamanOutstanding.reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  const saldoKas = await prisma.akun.findFirst({ where: { kode: "1.1.1" } })
  const totalPiutang = await prisma.akun.findFirst({ where: { kode: "1.2.1" } })

  const detailKas = saldoKas
    ? await prisma.detailJurnal.aggregate({
        where: { akunId: saldoKas.id },
        _sum: { debit: true, kredit: true },
      })
    : null

  const debitKas = detailKas?._sum.debit ?? 0
  const kreditKas = detailKas?._sum.kredit ?? 0
  const saldoKasAkun = Number(debitKas) - Number(kreditKas)

  const detailPiutang = totalPiutang
    ? await prisma.detailJurnal.aggregate({
        where: { akunId: totalPiutang.id },
        _sum: { debit: true, kredit: true },
      })
    : null

  const debitPiutang = detailPiutang?._sum.debit ?? 0
  const kreditPiutang = detailPiutang?._sum.kredit ?? 0
  const saldoPiutang = Number(debitPiutang) - Number(kreditPiutang)

  return {
    totalAuditLog,
    jurnalBulanIni,
    totalAnggota,
    totalSimpanan,
    totalPinjaman,
    saldoKas: saldoKasAkun,
    saldoPiutang,
  }
}
