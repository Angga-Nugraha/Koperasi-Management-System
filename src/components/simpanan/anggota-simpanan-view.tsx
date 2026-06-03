"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {formatTanggal} from "@/lib/format"

import { Badge } from "@/components/ui/badge"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

type Simpanan = {
  id: string
  jenisKode: string
  jenisNama: string
  saldo: number
}

type Mutasi = {
  id: string
  jenisKode: string
  jenisNama: string
  tipe: string
  nominal: number
  saldoSetelah: number
  keterangan: string | null
  createdAt: string
}

type Tagihan = {
  id: string
  bulan: number
  tahun: number
  nominal: number
  jatuhTempo: string
  tglBayar: string | null
  status: string
}

type Props = {
  simpanan: Simpanan[]
  mutasi: { data: Mutasi[]; total: number; page?: number; totalPages?: number }
  tagihan: Tagihan[]
  pageSize?: number
}

const TIPE_VARIANTS: Record<string, "default" | "destructive"> = {
  SETORAN: "default",
  PENARIKAN: "destructive",
}

const TIPE_LABEL: Record<string, string> = {
  SETORAN: "Setoran",
  PENARIKAN: "Penarikan",
}

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

const STATUS_LABEL: Record<string, string> = {
  BELUM_LUNAS: "Belum",
  LUNAS: "Lunas",
  TERLAMBAT: "Terlambat",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  BELUM_LUNAS: "outline",
  LUNAS: "default",
  TERLAMBAT: "destructive",
}

export function AnggotaSimpananView({ simpanan, mutasi, tagihan, pageSize = 20 }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalSaldo = simpanan.reduce((s, x) => s + x.saldo, 0)

  const years = [...new Set(tagihan.map((t) => t.tahun))].sort((a, b) => b - a)
  const [filterTahun, setFilterTahun] = useState(years[0] ?? new Date().getFullYear())
  const filteredTagihan = tagihan.filter((t) => t.tahun === filterTahun)

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    if (pageSize !== 20) params.set("pageSize", String(pageSize))
    router.push(`/anggota/simpanan?${params.toString()}`)
  }

  function handlePageSizeChange(size: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (size !== 20) params.set("pageSize", String(size))
    else params.delete("pageSize")
    params.delete("page")
    router.push(`/anggota/simpanan?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simpanan Saya</h1>
        <p className="text-sm text-muted-foreground">Ringkasan simpanan Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {simpanan.map((s) => (
          <Card key={s.jenisKode}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {s.jenisNama}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rp {s.saldo.toLocaleString("id-ID")}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {totalSaldo.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      {tagihan.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tagihan Simpanan Wajib</CardTitle>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-xs"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Tgl Bayar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTagihan.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{BULAN[t.bulan]} {t.tahun}</TableCell>
                    <TableCell className="text-right font-mono">Rp{t.nominal.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-xs">{formatTanggal(t.jatuhTempo)}</TableCell>
                    <TableCell className="text-xs">{t.tglBayar ? formatTanggal(t.tglBayar) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mutasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mutasi.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                mutasi.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">
                      {formatTanggal(t.createdAt)}
                    </TableCell>
                    <TableCell>{t.jenisNama}</TableCell>
                    <TableCell>
                      <Badge variant={TIPE_VARIANTS[t.tipe] ?? "secondary"}>
                        {TIPE_LABEL[t.tipe] ?? t.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      Rp {t.nominal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      Rp {t.saldoSetelah.toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={mutasi.page ?? 1}
            totalPages={mutasi.totalPages ?? 0}
            total={mutasi.total}
            pageSize={pageSize}
            onPageChange={goPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>
    </div>
  )
}
