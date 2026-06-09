"use client"

/**
 * @file src/components/anggota/anggota-table.tsx
 * @description Komponen presentasional / interaktif: anggota-table.
 */

import { useRouter } from "next/navigation"
import { useState, useCallback, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Search, Plus, Upload } from "lucide-react"
import { formatTanggal } from "@/lib/format"
import Link from "next/link"
import { TambahAnggotaSheet } from "@/components/anggota/tambah-anggota-sheet"

type Anggota = {
  id: string
  nik: string
  noAnggota: string
  nama: string
  noHp: string | null
  jenisKelamin: string | null
  status: string
  tglMasuk: string
}

type Props = {
  data: Anggota[]
  total: number
  page: number
  totalPages: number
  pageSize?: number
  search: string
  status: string
  sortBy: string
  sortOrder: string
}

const STATUS_MAP: Record<string, string> = {
  AKTIF: "Aktif",
  NONAKTIF: "Nonaktif",
  KELUAR: "Keluar",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  AKTIF: "default",
  NONAKTIF: "secondary",
  KELUAR: "destructive",
}

export function AnggotaTable({
  data,
  total,
  page,
  totalPages,
  pageSize = 20,
  search: initialSearch,
  status: initialStatus,
  sortBy: initialSortBy,
  sortOrder: initialSortOrder,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [tambahOpen, setTambahOpen] = useState(false)

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams(window.location.search)
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    return params
  }

  const toggleSort = useCallback(
    (col: string) => {
      const same = col === initialSortBy
      const newOrder = same && initialSortOrder === "asc" ? "desc" : "asc"
      const params = buildParams({ sortBy: col, sortOrder: newOrder, page: "" })
      startTransition(() => {
        router.push(`/pengurus/anggota?${params.toString()}`)
      })
    },
    [initialSortBy, initialSortOrder, router],
  )

  function onSearch() {
    const params = buildParams({ search, status: status !== "SEMUA" ? status : "", page: "" })
    startTransition(() => {
      router.push(`/pengurus/anggota?${params.toString()}`)
    })
  }

  function onPageChange(p: number) {
    const params = buildParams({
      page: String(p),
      pageSize: pageSize !== 20 ? String(pageSize) : "",
    })
    startTransition(() => {
      router.push(`/pengurus/anggota?${params.toString()}`)
    })
  }

  function handlePageSizeChange(size: number) {
    const params = buildParams({ pageSize: size !== 20 ? String(size) : "", page: "" })
    startTransition(() => {
      router.push(`/pengurus/anggota?${params.toString()}`)
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Daftar Anggota</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/pengurus/anggota/impor">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Link>
              </Button>
              <Button onClick={() => setTambahOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Anggota
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:flex-1">
              <Label htmlFor="search" className="sr-only">
                Cari
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Cari nama / NIK / no anggota..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch()}
                />
              </div>
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v)
                  const params = buildParams({ status: v !== "SEMUA" ? v : "", page: "" })
                  startTransition(() => {
                    router.push(`/pengurus/anggota?${params.toString()}`)
                  })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                  <SelectItem value="KELUAR">Keluar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" onClick={onSearch} className="w-full sm:w-auto">
              Cari
            </Button>
          </div>

          <div className="relative overflow-x-auto rounded-md border">
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
              </div>
            )}
            <Table className={isPending ? "opacity-50" : ""}>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("noAnggota")}
                  >
                    No Anggota{" "}
                    {initialSortBy === "noAnggota" && (
                      <span className="text-muted-foreground ml-1">
                        {initialSortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jenis Kelamin</TableHead>
                  <TableHead>No. HP</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("tglMasuk")}
                  >
                    Tgl Masuk{" "}
                    {initialSortBy === "tglMasuk" && (
                      <span className="text-muted-foreground ml-1">
                        {initialSortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Belum ada data anggota
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.noAnggota}</TableCell>
                      <TableCell className="font-mono text-sm">{a.nik}</TableCell>
                      <TableCell>{a.nama}</TableCell>
                      <TableCell className="text-sm">
                        {a.jenisKelamin === "LAKI_LAKI"
                          ? "Laki-laki"
                          : a.jenisKelamin === "PEREMPUAN"
                            ? "Perempuan"
                            : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.noHp || "-"}
                      </TableCell>
                      <TableCell>{formatTanggal(a.tglMasuk)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANTS[a.status] ?? "secondary"}>
                          {STATUS_MAP[a.status] ?? a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/pengurus/anggota/${a.id}`}>Detail</Link>
                        </Button>
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

      <TambahAnggotaSheet open={tambahOpen} onOpenChange={setTambahOpen} />
    </>
  )
}
