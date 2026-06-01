"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatTanggal } from "@/lib/format"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ArusKasItem = {
  tanggal: string
  noJurnal: string
  keterangan: string | null
  masuk: number
  keluar: number
}

type Props = {
  dari: string
  sampai: string
  items: ArusKasItem[]
  totalMasuk: number
  totalKeluar: number
  saldoAkhir: number
  page?: number
  totalPages?: number
}

export function ArusKasClient({ dari, sampai, items, totalMasuk, totalKeluar, saldoAkhir, page = 1, totalPages = 0 }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`${pathname}?${params.toString()}`)
  }

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Dari</Label>
          <Input type="date" name="dari" defaultValue={dari} />
        </div>
        <div className="space-y-2">
          <Label>Sampai</Label>
          <Input type="date" name="sampai" defaultValue={sampai} />
        </div>
        <Button type="submit">Tampilkan</Button>
      </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Masuk</p>
            <p className="text-xl font-bold text-green-700">{fmt(totalMasuk)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Keluar</p>
            <p className="text-xl font-bold text-red-700">{fmt(totalKeluar)}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Saldo Akhir</p>
            <p className={`text-xl font-bold ${saldoAkhir >= 0 ? "text-blue-700" : "text-red-700"}`}>
              {fmt(saldoAkhir)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jurnal</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Masuk</TableHead>
              <TableHead className="text-right">Keluar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Tidak ada transaksi kas
                </TableCell>
              </TableRow>
            )}
            {items.map((i, idx) => (
              <TableRow key={idx}>
                <TableCell>{formatTanggal(i.tanggal)}</TableCell>
                <TableCell className="font-mono text-xs">{i.noJurnal}</TableCell>
                <TableCell>{i.keterangan}</TableCell>
                <TableCell className="text-right text-green-700">
                  {i.masuk > 0 ? fmt(i.masuk) : "-"}
                </TableCell>
                <TableCell className="text-right text-red-700">
                  {i.keluar > 0 ? fmt(i.keluar) : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Halaman {page} dari {totalPages}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
              Sebelumnya
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
