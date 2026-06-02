import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank, HandCoins, DollarSign } from "lucide-react"
import { getDashboardAnggota } from "@/actions/dashboard"

const CARD_STYLES = [
  { border: "border-l-emerald-500", icon: "text-emerald-500" },
  { border: "border-l-amber-500", icon: "text-amber-500" },
  { border: "border-l-violet-500", icon: "text-violet-500" },
]

export default async function AnggotaDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  const data = await getDashboardAnggota(anggotaId)

  const cards = [
    {
      title: "Saldo Simpanan",
      value: `Rp ${data.totalSimpanan.toLocaleString("id-ID")}`,
      sub: "Total seluruh simpanan",
      icon: PiggyBank,
    },
    {
      title: "Pinjaman Aktif",
      value: `Rp ${data.totalPinjaman.toLocaleString("id-ID")}`,
      sub: "Sisa pinjaman",
      icon: HandCoins,
    },
    {
      title: "SHU Diterima",
      value: `Rp ${data.shuDiterima.toLocaleString("id-ID")}`,
      sub: "Tahun terakhir",
      icon: DollarSign,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Anggota</h1>
        <p className="text-sm text-muted-foreground">Selamat datang, {session?.user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card, i) => {
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

      {data.simpanan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rincian Simpanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.simpanan.map((s) => (
                <div key={s.kode} className="rounded-lg border border-l-4 border-l-emerald-500 p-4">
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
              {data.pinjamanAktif.map((p) => (
                <div key={`pinjaman-${p.jumlah}-${p.status}`} className="flex items-center justify-between rounded-lg border border-l-4 border-l-amber-500 p-3">
                  <div>
                    <p className="text-sm font-medium">
                      Pinjaman Rp {p.jumlah.toLocaleString("id-ID")}
                    </p>
                    <p className="text-xs text-muted-foreground">Status: {p.status}</p>
                  </div>
                  <p className="font-bold text-amber-600">
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
