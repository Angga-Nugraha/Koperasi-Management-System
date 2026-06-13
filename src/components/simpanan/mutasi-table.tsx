"use client"

/**
 * @file src/components/simpanan/mutasi-table.tsx
 * @description Komponen presentasional / interaktif: mutasi-table.
 */

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatTanggal, formatRupiah } from "@/lib/format"

import { DataTablePagination } from "@/components/ui/data-table-pagination"

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

type Props = {
  data: Mutasi[]
  total: number
  page: number
  totalPages: number
  pageSize?: number
  anggotaId: string
}

const TIPE_VARIANTS: Record<string, "default" | "destructive"> = {
  SETORAN: "default",
  PENARIKAN: "destructive",
}

const TIPE_LABEL: Record<string, string> = {
  SETORAN: "Setoran",
  PENARIKAN: "Penarikan",
}

export function MutasiTable({ data, total, page, totalPages, pageSize = 20, anggotaId }: Props) {
  const router = useRouter()
  const [jenisFilter, setJenisFilter] = useState("SEMUA")
  const [jenisList, setJenisList] = useState<Array<{ kode: string; nama: string }>>([])

  useEffect(() => {
    fetch("/api/jenis-simpanan")
      .then((r) => r.json())
      .then(setJenisList)
      .catch(() => {})
  }, [])

  function onFilterChange(v: string) {
    setJenisFilter(v)
    const params = new URLSearchParams()
    if (v !== "SEMUA") params.set("jenis", v)
    router.push(`/pengurus/simpanan/${anggotaId}?${params.toString()}`)
  }

  function onPageChange(p: number) {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(p))
    if (pageSize !== 20) params.set("pageSize", String(pageSize))
    router.push(`/pengurus/simpanan/${anggotaId}?${params.toString()}`)
  }

  function handlePageSizeChange(size: number) {
    const params = new URLSearchParams(window.location.search)
    if (size !== 20) params.set("pageSize", String(size))
    else params.delete("pageSize")
    params.delete("page")
    router.push(`/pengurus/simpanan/${anggotaId}?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Mutasi</CardTitle>
          <div className="w-full sm:w-40">
            <Select value={jenisFilter} onValueChange={onFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua</SelectItem>
                {jenisList.map((j) => (
                  <SelectItem key={j.kode} value={j.kode}>
                    {j.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
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
                <TableHead className="text-right">Saldo Setelah</TableHead>
                <TableHead>Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{formatTanggal(t.createdAt)}</TableCell>
                    <TableCell>{t.jenisNama}</TableCell>
                    <TableCell>
                      <Badge variant={TIPE_VARIANTS[t.tipe] ?? "secondary"}>
                        {TIPE_LABEL[t.tipe] ?? t.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRupiah(t.nominal)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatRupiah(t.saldoSetelah)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {t.keterangan ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </CardContent>
    </Card>
  )
}
