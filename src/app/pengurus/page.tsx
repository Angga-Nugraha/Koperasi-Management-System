import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, PiggyBank, HandCoins, DollarSign } from "lucide-react"
import { getDashboardPengurus } from "@/actions/dashboard"
import { SimpananChart } from "./simpanan-chart"
import { PinjamanStatusChart } from "./pinjaman-status-chart"

export default async function PengurusDashboard() {
  const session = await auth()
  const data = await getDashboardPengurus()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Pengurus</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {session?.user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Anggota</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalAnggota}</p>
            <p className="text-xs text-muted-foreground">Anggota aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Simpanan</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.totalSimpanan.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Seluruh jenis simpanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pinjaman Outstanding</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.totalPinjaman.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Belum lunas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SHU Tahun Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.totalSHU.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Tahun berjalan</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tren Simpanan 6 Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpananChart data={data.simpananChart} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pinjaman per Status</CardTitle>
          </CardHeader>
          <CardContent>
            <PinjamanStatusChart data={data.pinjamanPerStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
