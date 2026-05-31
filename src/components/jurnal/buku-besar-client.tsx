"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatTanggal } from "@/lib/format"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type AkunItem = { id: string; kode: string; nama: string; tipe: string; saldoNormal: string }

type DetailItem = {
  noJurnal: string
  tanggal: string
  keterangan: string
  debit: number
  kredit: number
  saldoNormal: string
}

type Props = {
  akunList: AkunItem[]
  akunId: string
  dari: string
  sampai: string
  detail: DetailItem[]
  akunTerpilih: AkunItem | null
  saldoAwal?: number
  page?: number
  totalPages?: number
}

export function BukuBesarClient({ akunList, akunId, dari, sampai, detail, akunTerpilih, saldoAwal = 0, page = 1, totalPages = 0 }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const params = new URLSearchParams()
    const fd = new FormData(form)
    const aId = fd.get("akunId") as string
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    if (aId) params.set("akunId", aId)
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/buku-besar?${params.toString()}`)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  let saldo = saldoAwal
  const rows = detail.map((d) => {
    if (d.saldoNormal === "DEBIT") {
      saldo += d.debit - d.kredit
    } else {
      saldo += d.kredit - d.debit
    }
    return { ...d, saldo: Math.round(saldo * 100) / 100 }
  })

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    router.push(`/pengurus/jurnal/buku-besar?${params.toString()}`)
  }

  return (
      <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Akun</Label>
          <Select name="akunId" defaultValue={akunId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Pilih akun" />
            </SelectTrigger>
            <SelectContent>
              {akunList.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.kode} - {a.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      {akunTerpilih && (
        <>
          <Card>
            <CardContent className="p-4">
              <p className="text-lg font-semibold">
                {akunTerpilih.kode} - {akunTerpilih.nama}
              </p>
            </CardContent>
          </Card>

          <div className="rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No Jurnal</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Tidak ada transaksi untuk periode ini
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{formatTanggal(r.tanggal)}</TableCell>
                    <TableCell className="font-mono text-xs">{r.noJurnal}</TableCell>
                    <TableCell>{r.keterangan}</TableCell>
                    <TableCell className="text-right">{r.debit > 0 ? fmt(r.debit) : "-"}</TableCell>
                    <TableCell className="text-right">{r.kredit > 0 ? fmt(r.kredit) : "-"}</TableCell>
                    <TableCell className="text-right font-medium">{fmt(r.saldo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{rows.length} dari {detail.length > 0 ? `${(page - 1) * detail.length + rows.length}` : 0} transaksi</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                  Sebelumnya
                </Button>
                <span>Halaman {page} dari {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
