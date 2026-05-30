import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank, HandCoins, DollarSign } from "lucide-react"
import { getDashboardAnggota } from "@/actions/dashboard"

export default async function AnggotaDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  const data = await getDashboardAnggota(anggotaId)

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
            <p className="text-2xl font-bold">
              Rp {data.totalSimpanan.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Total seluruh simpanan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pinjaman Aktif</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.totalPinjaman.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Sisa pinjaman</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SHU Diterima</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {data.shuDiterima.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground">Tahun terakhir</p>
          </CardContent>
        </Card>
      </div>

      {data.simpanan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian Simpanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.simpanan.map((s) => (
                <div
                  key={s.kode}
                  className="rounded-lg border p-4"
                >
                  <p className="text-sm text-muted-foreground">{s.nama}</p>
                  <p className="mt-1 text-xl font-bold">
                    Rp {s.saldo.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.pinjamanAktif.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pinjaman Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.pinjamanAktif.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      Pinjaman Rp {p.jumlah.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-muted-foreground">Status: {p.status}</p>
                  </div>
                  <p className="font-bold text-destructive">
                    Rp {p.sisaPinjaman.toLocaleString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
