import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet } from "lucide-react"
import Link from "next/link"

const REPORTS = [
  {
    title: "Neraca",
    desc: "Laporan posisi keuangan (aset, liabilitas, ekuitas)",
    viewHref: "/pengawas/laporan/neraca",
    exportType: "neraca",
  },
  {
    title: "Laba / Rugi",
    desc: "Laporan pendapatan dan beban periode tertentu",
    viewHref: "/pengawas/laporan/laba-rugi",
    exportType: "laba-rugi",
  },
  {
    title: "Arus Kas",
    desc: "Laporan arus kas masuk dan keluar",
    viewHref: "/pengawas/laporan/arus-kas",
    exportType: "arus-kas",
  },
  {
    title: "Neraca Saldo",
    desc: "Daftar saldo seluruh akun",
    viewHref: "/pengawas/laporan/neraca-saldo",
    exportType: "neraca-saldo",
  },
  {
    title: "Buku Besar",
    desc: "Riwayat transaksi per akun",
    viewHref: "/pengawas/laporan/buku-besar?akunId=",
    exportType: "buku-besar",
  },
  {
    title: "SHU",
    desc: "Sisa Hasil Usaha",
    viewHref: "/pengawas/laporan/shu",
    exportType: "shu",
  },
]

export default function LaporanPengawasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h1>
        <p className="text-sm text-muted-foreground">Lihat dan unduh laporan keuangan koperasi</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{r.desc}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={r.viewHref}>
                    <FileText className="mr-1 h-3 w-3" />
                    Lihat
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/export/laporan?type=${r.exportType}`} target="_blank">
                    <FileSpreadsheet className="mr-1 h-3 w-3" />
                    Excel
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  )
}
