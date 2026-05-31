"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { formatTanggal } from "@/lib/format"
import Link from "next/link"

type Pinjaman = {
  id: string
  noAnggota: string
  namaAnggota: string
  jenisPinjaman: string
  jumlah: number
  tenor: number
  sisaPinjaman: number
  status: string
  tglPengajuan: string
}

type Props = {
  data: Pinjaman[]
  total: number
  page: number
  totalPages: number
  search?: string
  status?: string
}

const STATUS_LABEL: Record<string, string> = {
  PENGAJUAN: "Pengajuan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  DICAIKKAN: "Dicairkan",
  LUNAS: "Lunas",
  GAGAL: "Gagal",
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENGAJUAN: "outline",
  DISETUJUI: "secondary",
  DITOLAK: "destructive",
  DICAIKKAN: "default",
  LUNAS: "default",
  GAGAL: "destructive",
}

export function PinjamanTable({ data, total, page, totalPages, search: initialSearch, status: initialStatus }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch ?? "")

  function applyFilter(key: string, value: string) {
    const params = new URLSearchParams()
    if (search && key !== "search") params.set("search", search)
    if (value && value !== "SEMUA") params.set(key, value)
    if (key === "search") params.set("search", value)
    if (page > 1) params.set("page", "1")
    router.push(`/pengurus/pinjaman?${params.toString()}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (initialStatus && initialStatus !== "SEMUA") params.set("status", initialStatus)
    if (p > 1) params.set("page", String(p))
    router.push(`/pengurus/pinjaman?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    applyFilter("search", search)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-60 pl-8"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">Cari</Button>
        </form>

        <Select
          value={initialStatus ?? "SEMUA"}
          onValueChange={(v) => applyFilter("status", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Semua status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua</SelectItem>
            <SelectItem value="PENGAJUAN">Pengajuan</SelectItem>
            <SelectItem value="DISETUJUI">Disetujui</SelectItem>
            <SelectItem value="DITOLAK">Ditolak</SelectItem>
            <SelectItem value="DICAIKKAN">Dicairkan</SelectItem>
            <SelectItem value="LUNAS">Lunas</SelectItem>
            <SelectItem value="GAGAL">Gagal</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button asChild>
            <Link href="/pengurus/pinjaman/ajukan">+ Ajukan Pinjaman</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Anggota</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Jumlah</TableHead>
              <TableHead className="text-right">Tenor</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tgl Pengajuan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Tidak ada data pinjaman
                </TableCell>
              </TableRow>
            ) : (
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.noAnggota}</TableCell>
                  <TableCell>{p.namaAnggota}</TableCell>
                  <TableCell className="text-xs">{p.jenisPinjaman}</TableCell>
                  <TableCell className="text-right font-mono">
                    Rp{Number(p.jumlah).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">{p.tenor} bln</TableCell>
                  <TableCell className="text-right font-mono">
                    Rp{Number(p.sisaPinjaman).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatTanggal(p.tglPengajuan)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pengurus/pinjaman/${p.id}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Total {total} data — Halaman {page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
