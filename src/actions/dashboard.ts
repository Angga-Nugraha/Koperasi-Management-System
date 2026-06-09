/**
 * @file src/actions/dashboard.ts
 * @description Server Action untuk mengambil data statistik dan ringkasan dashboard.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth, assertRole } from "@/lib/auth"
import { tahunRange, hinggaAkhirTahun } from "@/lib/date"
import { round2 } from "@/lib/math"
import { COA_KAS, COA_PIUTANG_PINJAMAN, COA_KAS_BANK } from "@/lib/jurnal"

export async function getTahunList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const years = await prisma.jurnalUmum.findMany({
    select: { tanggal: true },
    orderBy: { tanggal: "desc" },
  })
  const set = new Set<number>()
  for (const j of years) set.add(j.tanggal.getFullYear())
  set.add(new Date().getFullYear())

  return Array.from(set).sort((a, b) => b - a)
}

export async function getDashboardPengurus(tahun: number) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const range = tahunRange(tahun)
  const cumulative = hinggaAkhirTahun(tahun)

  const [
    totalAnggota,
    totalSimpananAgg,
    pinjamanOutstanding,
    detailPendapatanBeban,
    transaksiTahun,
    pinjamanPerStatus,
    akunKas,
    transaksiTerbaru,
    akunKasBank,
    akunKewajiban,
  ] = await Promise.all([
    prisma.anggota.count({ where: { status: "AKTIF" } }),
    prisma.simpanan.aggregate({ _sum: { saldo: true } }),
    prisma.pinjaman.findMany({
      where: { status: { notIn: ["LUNAS", "DITOLAK"] } },
      select: { sisaPinjaman: true },
    }),
    prisma.detailJurnal.findMany({
      where: {
        akun: { tipe: { in: ["PENDAPATAN", "BEBAN"] } },
        jurnal: { tanggal: range, keterangan: { not: { contains: "Jurnal Penutup" } } },
      },
      include: { akun: { select: { tipe: true } } },
    }),
    prisma.transaksiSimpanan.findMany({
      where: { createdAt: range },
      select: { nominal: true, tipe: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pinjaman.groupBy({
      by: ["status"],
      where: { tglPengajuan: range },
      _count: { id: true },
      _sum: { jumlah: true },
    }),
    prisma.akun.findFirst({ where: { kode: COA_KAS } }),
    prisma.jurnalUmum.findMany({
      where: { tanggal: range },
      orderBy: { tanggal: "desc" },
      take: 5,
      include: {
        detail: {
          include: { akun: { select: { kode: true, nama: true } } },
          orderBy: { debit: "desc" },
        },
      },
    }),
    prisma.akun.findMany({ where: { kode: { in: [...COA_KAS_BANK] } } }),
    prisma.akun.findMany({ where: { tipe: "LIABILITAS" } }),
  ])

  const totalSimpanan = Number(totalSimpananAgg._sum.saldo ?? 0)
  const totalPinjaman = pinjamanOutstanding.reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  // Compute SHU
  let totalPendapatan = 0
  let totalBeban = 0
  for (const d of detailPendapatanBeban) {
    if (d.akun.tipe === "PENDAPATAN") {
      totalPendapatan += Number(d.kredit) - Number(d.debit)
    } else {
      totalBeban += Number(d.debit) - Number(d.kredit)
    }
  }
  const totalSHU = round2(totalPendapatan - totalBeban)

  // Savings monthly chart
  const chartData: Record<string, { setoran: number; penarikan: number }> = {}
  for (const t of transaksiTahun) {
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

  // Kas flow
  const kasId = akunKas?.id
  const detailKasTahun = kasId
    ? await prisma.detailJurnal.findMany({
        where: { akunId: kasId, jurnal: { tanggal: range } },
        include: { jurnal: { select: { tanggal: true } } },
        orderBy: { jurnal: { tanggal: "asc" } },
      })
    : []
  const flowData: Record<string, { masuk: number; keluar: number }> = {}
  for (const d of detailKasTahun) {
    const month = d.jurnal.tanggal.toLocaleString("id-ID", { month: "short", year: "2-digit" })
    if (!flowData[month]) flowData[month] = { masuk: 0, keluar: 0 }
    flowData[month].masuk += Number(d.debit)
    flowData[month].keluar += Number(d.kredit)
  }
  const trendChart = Object.entries(flowData).map(([bulan, data]) => ({
    bulan,
    masuk: data.masuk,
    keluar: data.keluar,
  }))

  // Kas balance + kewajiban
  const kasBankIds = akunKasBank.map((a) => a.id)
  let saldoKas = 0
  if (kasBankIds.length > 0) {
    const agg = await prisma.detailJurnal.aggregate({
      where: { akunId: { in: kasBankIds }, jurnal: { tanggal: cumulative } },
      _sum: { debit: true, kredit: true },
    })
    saldoKas = round2(Number(agg._sum.debit ?? 0) - Number(agg._sum.kredit ?? 0))
  }

  const kewajibanIds = akunKewajiban.map((a) => a.id)
  let kewajibanLancar = 0
  if (kewajibanIds.length > 0) {
    const agg = await prisma.detailJurnal.aggregate({
      where: { akunId: { in: kewajibanIds }, jurnal: { tanggal: cumulative } },
      _sum: { debit: true, kredit: true },
    })
    kewajibanLancar = round2(Number(agg._sum.kredit ?? 0) - Number(agg._sum.debit ?? 0))
  }

  const cashRatio = kewajibanLancar > 0 ? round2(saldoKas / kewajibanLancar) : 0

  let cashRatioStatus: string
  if (cashRatio >= 2.0) cashRatioStatus = "Sangat Baik"
  else if (cashRatio >= 1.75) cashRatioStatus = "Baik"
  else if (cashRatio >= 1.5) cashRatioStatus = "Cukup Baik"
  else if (cashRatio >= 1.25) cashRatioStatus = "Kurang Baik"
  else cashRatioStatus = "Buruk"

  return {
    totalAnggota,
    totalSimpanan,
    totalPinjaman,
    totalSHU,
    cashRatio,
    cashRatioStatus,
    saldoKas,
    kewajibanLancar,
    simpananChart,
    pinjamanPerStatus: pinjamanPerStatus.map((p) => ({
      status: p.status,
      count: p._count.id,
      total: Number(p._sum.jumlah ?? 0),
    })),
    trendChart,
    transaksiTerbaru: transaksiTerbaru.map((j) => ({
      id: j.id,
      noJurnal: j.noJurnal,
      tanggal: j.tanggal.toISOString(),
      keterangan: j.keterangan,
      totalDebit: Number(j.detail.reduce((s, d) => s + Number(d.debit), 0)),
      totalKredit: Number(j.detail.reduce((s, d) => s + Number(d.kredit), 0)),
      detail: j.detail.map((d) => ({
        akunKode: d.akun.kode,
        akunNama: d.akun.nama,
        debit: Number(d.debit),
        kredit: Number(d.kredit),
      })),
    })),
  }
}

export async function getDashboardAnggota(anggotaId: string) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA", "ANGGOTA")
  if (session.user.role === "ANGGOTA" && session.user.anggotaId !== anggotaId) {
    throw new Error("Forbidden")
  }
  const simpanan = await prisma.simpanan.findMany({
    where: { anggotaId },
    include: { jenisSimpanan: { select: { kode: true, nama: true } } },
  })

  const pinjamanAktif = await prisma.pinjaman.findMany({
    where: { anggotaId, status: { notIn: ["LUNAS", "DITOLAK", "GAGAL"] } },
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

export async function getDashboardPengawas(tahun: number) {
  await assertRole("PENGAWAS")
  const totalAuditLog = await prisma.auditLog.count()

  const awalBulan = new Date()
  awalBulan.setDate(1)
  awalBulan.setHours(0, 0, 0, 0)

  const jurnalBulanIni = await prisma.jurnalUmum.count({
    where: { tanggal: { gte: awalBulan } },
  })

  const totalAnggota = await prisma.anggota.count({ where: { status: "AKTIF" } })

  const totalSimpananAgg = await prisma.simpanan.aggregate({ _sum: { saldo: true } })
  const totalSimpanan = Number(totalSimpananAgg._sum.saldo ?? 0)

  const pinjamanOutstanding = await prisma.pinjaman.findMany({
    where: { status: { notIn: ["LUNAS", "DITOLAK"] } },
    select: { sisaPinjaman: true },
  })
  const totalPinjaman = pinjamanOutstanding.reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  const cumulative = hinggaAkhirTahun(tahun)

  const saldoKas = await prisma.akun.findFirst({ where: { kode: COA_KAS } })
  const totalPiutang = await prisma.akun.findFirst({ where: { kode: COA_PIUTANG_PINJAMAN } })

  const detailKas = saldoKas
    ? await prisma.detailJurnal.aggregate({
        where: { akunId: saldoKas.id, jurnal: { tanggal: cumulative } },
        _sum: { debit: true, kredit: true },
      })
    : null

  const debitKas = detailKas?._sum.debit ?? 0
  const kreditKas = detailKas?._sum.kredit ?? 0
  const saldoKasAkun = round2(Number(debitKas) - Number(kreditKas))

  const detailPiutang = totalPiutang
    ? await prisma.detailJurnal.aggregate({
        where: { akunId: totalPiutang.id, jurnal: { tanggal: cumulative } },
        _sum: { debit: true, kredit: true },
      })
    : null

  const debitPiutang = detailPiutang?._sum.debit ?? 0
  const kreditPiutang = detailPiutang?._sum.kredit ?? 0
  const saldoPiutang = round2(Number(debitPiutang) - Number(kreditPiutang))

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
