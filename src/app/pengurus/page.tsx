/**
 * @file src/app/pengurus/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  PiggyBank,
  HandCoins,
  DollarSign,
  TrendingUp,
  History,
  Landmark,
} from "lucide-react"
import { getDashboardPengurus, getTahunList } from "@/actions/dashboard"
import { SimpananChart } from "./simpanan-chart"
import { PinjamanStatusChart } from "./pinjaman-status-chart"
import { TransaksiTrendChart } from "./transaksi-trend-chart"
import { TransaksiTerbaru } from "./transaksi-terbaru"
import { TahunSelector } from "@/components/tahun-selector"

const CARD_STYLES = [
  { border: "border-l-blue-500", icon: "text-blue-500" },
  { border: "border-l-emerald-500", icon: "text-emerald-500" },
  { border: "border-l-amber-500", icon: "text-amber-500" },
  { border: "border-l-violet-500", icon: "text-violet-500" },
  { border: "border-l-cyan-500", icon: "text-cyan-500" },
]

type Props = {
  searchParams: Promise<{ tahun?: string }>
}

export default async function PengurusDashboard({ searchParams }: Props) {
  const session = await auth()
  const sp = await searchParams
  const daftarTahun = await getTahunList()
  const tahun = Number(sp.tahun) || new Date().getFullYear()
  const data = await getDashboardPengurus(tahun)

  const cards = [
    {
      title: "Total Anggota",
      value: data.totalAnggota.toString(),
      sub: "Anggota aktif",
      icon: Users,
    },
    {
      title: "Total Simpanan",
      value: `Rp ${data.totalSimpanan.toLocaleString("id-ID")}`,
      sub: "Seluruh jenis simpanan",
      icon: PiggyBank,
    },
    {
      title: "Pinjaman Outstanding",
      value: `Rp ${data.totalPinjaman.toLocaleString("id-ID")}`,
      sub: "Belum lunas",
      icon: HandCoins,
    },
    {
      title: "SHU Tahun Ini",
      value: `Rp ${Math.round(data.totalSHU).toLocaleString("id-ID")}`,
      sub: `Tahun ${tahun}`,
      icon: DollarSign,
    },
    {
      title: "Cash Ratio",
      value: `${(data.cashRatio * 100).toFixed(1)}%`,
      sub: `Kas+Bank Rp${data.saldoKas.toLocaleString("id-ID")} / Kewajiban Rp${data.kewajibanLancar.toLocaleString("id-ID")}`,
      icon: Landmark,
      status: data.cashRatioStatus as string,
    },
  ]

  function cardBorder(i: number, card: (typeof cards)[number]) {
    if (card.status) {
      if (card.status === "Sangat Baik") return "border-l-emerald-500"
      if (card.status === "Baik") return "border-l-green-400"
      if (card.status === "Cukup Baik") return "border-l-yellow-400"
      if (card.status === "Kurang Baik") return "border-l-orange-400"
      if (card.status === "Buruk") return "border-l-red-500"
    }
    return CARD_STYLES[i]!.border
  }
  function cardIconColor(i: number, card: (typeof cards)[number]) {
    if (card.status) {
      if (card.status === "Sangat Baik") return "text-emerald-500"
      if (card.status === "Baik") return "text-green-400"
      if (card.status === "Cukup Baik") return "text-yellow-400"
      if (card.status === "Kurang Baik") return "text-orange-400"
      if (card.status === "Buruk") return "text-red-500"
    }
    return CARD_STYLES[i]!.icon
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Pengurus</h1>
          <p className="text-sm text-muted-foreground">Selamat datang, {session?.user?.email}</p>
        </div>
        <TahunSelector tahun={tahun} daftarTahun={daftarTahun} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className={`border-l-4 ${cardBorder(i, card)}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${cardIconColor(i, card)}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
                {card.status && (
                  <p
                    className={`mt-1 text-xs font-medium ${
                      card.status === "Sangat Baik"
                        ? "text-emerald-600"
                        : card.status === "Baik"
                          ? "text-green-500"
                          : card.status === "Cukup Baik"
                            ? "text-yellow-500"
                            : card.status === "Kurang Baik"
                              ? "text-orange-500"
                              : "text-red-500"
                    }`}
                  >
                    {card.status}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">
              {tahun > 0 ? `Tren Simpanan ${tahun}` : "Tren Simpanan"}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <SimpananChart data={data.simpananChart} />
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">Pinjaman per Status</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <PinjamanStatusChart data={data.pinjamanPerStatus} />
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            Arus Kas {tahun}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <TransaksiTrendChart data={data.trendChart} />
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4 text-amber-500" />5 Transaksi Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <TransaksiTerbaru data={data.transaksiTerbaru} />
        </CardContent>
      </Card>
    </div>
  )
}
