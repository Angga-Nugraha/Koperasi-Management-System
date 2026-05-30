import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, PiggyBank, HandCoins, Landmark, Wallet } from "lucide-react"
import { getDashboardPengawas } from "@/actions/dashboard"

export default async function PengawasDashboard() {
  const session = await auth()
  const data = await getDashboardPengawas()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Pengawas</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {session?.user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Anggota Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalAnggota}</p>
            <p className="text-xs text-muted-foreground">Total anggota</p>
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
            <CardTitle className="text-sm font-medium">Jurnal Bulan Ini</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.jurnalBulanIni}</p>
            <p className="text-xs text-muted-foreground">Total transaksi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Kas</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.saldoKas.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Akun Kas (1.1.1)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Piutang Pinjaman</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.saldoPiutang.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Akun Piutang (1.2.1)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Log Audit</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{data.totalAuditLog}</p>
          <p className="text-xs text-muted-foreground">Seluruh catatan audit</p>
        </CardContent>
      </Card>
    </div>
  )
}
