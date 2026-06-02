"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
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
import { Search, Plus, ChevronLeft, ChevronRight, Upload } from "lucide-react"
import { formatTanggal } from "@/lib/format"
import Link from "next/link"

type Anggota = {
  id: string
  nik: string
  noAnggota: string
  nama: string
  status: string
  tglMasuk: string
}

type Props = {
  data: Anggota[]
  total: number
  page: number
  totalPages: number
  search: string
  status: string
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
  search: initialSearch,
  status: initialStatus,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)

  function onSearch() {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status && status !== "SEMUA") params.set("status", status)
    router.push(`/pengurus/anggota?${params.toString()}`)
  }

  function onPageChange(p: number) {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(p))
    router.push(`/pengurus/anggota?${params.toString()}`)
  }

  return (
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
            <Button asChild>
              <Link href="/pengurus/anggota/tambah">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Anggota
              </Link>
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
                onSearch()
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

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>No Anggota</TableHead>
              <TableHead>NIK</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Tgl Masuk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Belum ada data anggota
                </TableCell>
              </TableRow>
            ) : (
              data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-sm">{a.noAnggota}</TableCell>
                  <TableCell className="font-mono text-sm">{a.nik}</TableCell>
                  <TableCell>{a.nama}</TableCell>
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

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total {total} anggota</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
