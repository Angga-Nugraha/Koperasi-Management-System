"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
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
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownLeft, FileText } from "lucide-react"
import Link from "next/link"
import { SetorSheet } from "@/components/simpanan/setor-sheet"
import { TarikSheet } from "@/components/simpanan/tarik-sheet"

type Simpanan = {
  id: string
  anggotaId: string
  noAnggota: string
  namaAnggota: string
  jenisKode: string
  jenisNama: string
  saldo: number
}

type Props = {
  data: Simpanan[]
  total: number
  page: number
  totalPages: number
  search: string
}

const JENIS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  POKOK: "default",
  WAJIB: "secondary",
  SUKARELA: "outline",
}

export function SimpananTable({ data, total, page, totalPages, search: initialSearch }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [jenisFilter, setJenisFilter] = useState("SEMUA")
  const [jenisList, setJenisList] = useState<Array<{ kode: string; nama: string }>>([])
  const [setorOpen, setSetorOpen] = useState(false)
  const [tarikOpen, setTarikOpen] = useState(false)

  useEffect(() => {
    fetch("/api/jenis-simpanan").then(r => r.json()).then(setJenisList).catch(() => {})
  }, [])

  function onSearch() {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (jenisFilter && jenisFilter !== "SEMUA") params.set("jenis", jenisFilter)
    router.push(`/pengurus/simpanan?${params.toString()}`)
  }

  function onPageChange(p: number) {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(p))
    router.push(`/pengurus/simpanan?${params.toString()}`)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Daftar Simpanan</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/pengurus/simpanan/tagihan">
                <FileText className="mr-2 h-4 w-4" />
                Tagihan
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setTarikOpen(true)}>
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              Tarik
            </Button>
            <Button onClick={() => setSetorOpen(true)}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Setor
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="sr-only">Cari</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Cari anggota..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
              />
            </div>
          </div>
          <div className="w-40">
            <Select value={jenisFilter} onValueChange={(v) => { setJenisFilter(v); onSearch() }}>
              <SelectTrigger>
                <SelectValue placeholder="Semua jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEMUA">Semua</SelectItem>
                {jenisList.map((j) => (
                  <SelectItem key={j.kode} value={j.kode}>{j.nama}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" onClick={onSearch}>Cari</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No Anggota</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Belum ada data simpanan
                </TableCell>
              </TableRow>
            ) : (
              data.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.noAnggota}</TableCell>
                  <TableCell>{s.namaAnggota}</TableCell>
                  <TableCell>
                    <Badge variant={JENIS_VARIANTS[s.jenisKode] ?? "secondary"}>
                      {s.jenisNama}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    Rp {s.saldo.toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/pengurus/simpanan/${s.anggotaId}`}>Detail</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total {total} simpanan</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <SetorSheet open={setorOpen} onOpenChange={setSetorOpen} />
      <TarikSheet open={tarikOpen} onOpenChange={setTarikOpen} />
    </Card>
  )
}
