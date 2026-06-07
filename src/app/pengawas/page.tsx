/**
 * @file src/app/pengawas/page.tsx
 * @description Halaman laporan/fitur pengawas untuk modul: page.
 */

import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, PiggyBank, HandCoins, Landmark, Wallet } from "lucide-react"
import { getDashboardPengawas, getTahunList } from "@/actions/dashboard"
import { TahunSelector } from "@/components/tahun-selector"

const CARD_STYLES = [
  { border: "border-l-blue-500", icon: "text-blue-500" },
  { border: "border-l-emerald-500", icon: "text-emerald-500" },
  { border: "border-l-amber-500", icon: "text-amber-500" },
  { border: "border-l-cyan-500", icon: "text-cyan-500" },
]

const CARD_STYLES_BOTTOM = [
  { border: "border-l-teal-500", icon: "text-teal-500" },
  { border: "border-l-rose-500", icon: "text-rose-500" },
]

type Props = {
  searchParams: Promise<{ tahun?: string }>
}

export default async function PengawasDashboard({ searchParams }: Props) {
  const session = await auth()
  const sp = await searchParams
  const daftarTahun = await getTahunList()
  const tahun = Number(sp.tahun) || daftarTahun[0] || new Date().getFullYear()
  const data = await getDashboardPengawas(tahun)

  const topCards = [
    { title: "Anggota Aktif", value: data.totalAnggota.toString(), sub: "Total anggota", icon: Users },
    { title: "Total Simpanan", value: `Rp ${data.totalSimpanan.toLocaleString("id-ID")}`, sub: "Seluruh jenis simpanan", icon: PiggyBank },
    { title: "Pinjaman Outstanding", value: `Rp ${data.totalPinjaman.toLocaleString("id-ID")}`, sub: "Belum lunas", icon: HandCoins },
    { title: "Jurnal Bulan Ini", value: data.jurnalBulanIni.toString(), sub: "Total transaksi", icon: FileText },
  ]

  const bottomCards = [
    { title: "Saldo Kas", value: `Rp ${data.saldoKas.toLocaleString("id-ID")}`, sub: `Akun Kas (1.1.1) — ${tahun}`, icon: Wallet },
    { title: "Piutang Pinjaman", value: `Rp ${data.saldoPiutang.toLocaleString("id-ID")}`, sub: `Akun Piutang (1.2.1) — ${tahun}`, icon: Landmark },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Pengawas</h1>
          <p className="text-sm text-muted-foreground">Selamat datang, {session?.user?.email}</p>
        </div>
        <TahunSelector tahun={tahun} daftarTahun={daftarTahun} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {topCards.map((card, i) => {
          const Icon = card.icon
          const style = CARD_STYLES[i]!
          return (
            <Card key={card.title} className={`border-l-4 ${style.border}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${style.icon}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {bottomCards.map((card, i) => {
          const Icon = card.icon
          const style = CARD_STYLES_BOTTOM[i]!
          return (
            <Card key={card.title} className={`border-l-4 ${style.border}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-4 w-4 ${style.icon}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-l-4 border-l-gray-500">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Log Audit</CardTitle>
          <FileText className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data.totalAuditLog}</p>
          <p className="text-xs text-muted-foreground">Seluruh catatan audit</p>
        </CardContent>
      </Card>
    </div>
  )
}
