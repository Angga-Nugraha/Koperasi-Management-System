import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank, HandCoins, DollarSign } from "lucide-react"

export default async function AnggotaDashboard() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Anggota</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {session?.user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Simpanan</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp 0</p>
            <p className="text-xs text-muted-foreground">Total seluruh simpanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp 0</p>
            <p className="text-xs text-muted-foreground">Sisa pinjaman</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SHU Diterima</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp 0</p>
            <p className="text-xs text-muted-foreground">Tahun terakhir</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
