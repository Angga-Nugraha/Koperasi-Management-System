"use client"

/**
 * @file src/components/jurnal/jurnal-table.tsx
 * @description Komponen presentasional / interaktif: jurnal-table.
 */

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import Link from "next/link"
import { formatTanggal } from "@/lib/format"
import { useRouter, useSearchParams } from "next/navigation"

type JurnalItem = {
  id: string
  noJurnal: string
  tanggal: string
  keterangan: string
  totalDebit: number
  totalKredit: number
  detail: { akunKode: string; akunNama: string; debit: number; kredit: number }[]
}

type Props = {
  data: JurnalItem[]
  total: number
  page: number
  totalPages: number
  pageSize?: number
  search?: string
}

export function JurnalTable({ data, total, page, totalPages, pageSize = 20, search }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(search ?? "")

  function handleSearch() {
    const params = new URLSearchParams(searchParams.toString())
    if (searchValue) params.set("search", searchValue)
    else params.delete("search")
    params.set("page", "1")
    router.push(`/pengurus/jurnal?${params.toString()}`)
  }

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    if (pageSize !== 20) params.set("pageSize", String(pageSize))
    router.push(`/pengurus/jurnal?${params.toString()}`)
  }

  function handlePageSizeChange(size: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (size !== 20) params.set("pageSize", String(size))
    else params.delete("pageSize")
    params.delete("page")
    router.push(`/pengurus/jurnal?${params.toString()}`)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          placeholder="Cari no jurnal atau keterangan..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="w-full sm:max-w-sm"
        />
        <Button variant="secondary" onClick={handleSearch} className="w-full sm:w-auto">
          Cari
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Jurnal</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Belum ada jurnal
                </TableCell>
              </TableRow>
            )}
            {data.map((j) => (
              <TableRow key={j.id}>
                <TableCell>
                  <Link
                    href={`/pengurus/jurnal/${j.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {j.noJurnal}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{formatTanggal(j.tanggal)}</TableCell>
                <TableCell className="text-sm">{j.keterangan}</TableCell>
                <TableCell className="text-right text-sm">{fmt(j.totalDebit)}</TableCell>
                <TableCell className="text-right text-sm">{fmt(j.totalKredit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        onPageChange={goPage}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
