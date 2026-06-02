"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StrukPembayaran } from "@/components/struk-pembayaran"
import { ArrowLeft, RefreshCw, Wallet } from "lucide-react"
import {formatTanggal} from "@/lib/format"

import { generateTagihanWajib, bayarTagihanWajib, getTagihanWajibList } from "@/actions/simpanan"
import Link from "next/link"

type Tagihan = {
  id: string
  anggotaId: string
  noAnggota: string
  namaAnggota: string
  bulan: number
  tahun: number
  nominal: number
  jatuhTempo: string
  tglBayar: string | null
  status: string
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

export default function TagihanWajibPage() {
  const [data, setData] = useState<Tagihan[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterBulan, setFilterBulan] = useState<string>("")
  const [filterTahun, setFilterTahun] = useState<string>(String(new Date().getFullYear()))
  const [filterStatus, setFilterStatus] = useState<string>("SEMUA")
  const [filterSearch, setFilterSearch] = useState("")
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)
  const [generalInfo, setGeneralInfo] = useState<{ namaKoperasi: string; alamat: string | null; noAhu: string | null; logo: string | null } | null>(null)
  const [receipt, setReceipt] = useState<{
    noStruk: string
    nominal: number
    createdAt: string
    anggota: { nama: string; noAnggota: string }
    petugas: string
    bulan: number
    tahun: number
  } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getTagihanWajibList({
        bulan: filterBulan ? Number(filterBulan) : undefined,
        tahun: filterTahun ? Number(filterTahun) : undefined,
        status: filterStatus !== "SEMUA" ? filterStatus : undefined,
        search: filterSearch || undefined,
        page,
        pageSize: 20,
      })
      setData(result.data as Tagihan[])
      setTotal(result.total)
      setTotalPages(result.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data")
    } finally {
      setLoading(false)
    }
  }, [filterBulan, filterTahun, filterStatus, filterSearch, page])

  useEffect(() => {
    fetchData()
    fetch("/api/general-info").then(r => r.json()).then(setGeneralInfo).catch(() => {})
  }, [fetchData])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateTagihanWajib({
        bulan: filterBulan ? Number(filterBulan) : undefined,
        tahun: filterTahun ? Number(filterTahun) : undefined,
      })
      if (result.count === 0) {
        setError("Tagihan untuk periode ini sudah ada semua")
      } else {
        fetchData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate tagihan")
    } finally {
      setGenerating(false)
    }
  }

  async function handleBayar(tagihan: Tagihan) {
    setConfirm(null)
    setError(null)
    try {
      const result = await bayarTagihanWajib({ tagihanId: tagihan.id })
      if (result.success && result.data) {
        setReceipt(result.data)
        fetchData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal bayar tagihan")
    }
  }

  const handleCloseReceipt = useCallback(() => {
    setReceipt(null)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pengurus/simpanan">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Tagihan Simpanan Wajib</h1>
          <p className="text-sm text-muted-foreground">
            Total: {total} tagihan
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle>Filter & Generate</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
            <div className="space-y-1">
              <Label>Bulan</Label>
              <Select value={filterBulan} onValueChange={(v) => { setFilterBulan(v === "all" ? "" : v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-28">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {BULAN.slice(1).map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tahun</Label>
              <Input
                type="number"
                className="w-full lg:w-24"
                value={filterTahun}
                onChange={(e) => { setFilterTahun(e.target.value); setPage(1) }}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEMUA">Semua</SelectItem>
                  <SelectItem value="BELUM_LUNAS">Belum</SelectItem>
                  <SelectItem value="LUNAS">Lunas</SelectItem>
                  <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cari Anggota</Label>
              <Input
                className="w-full lg:w-44"
                placeholder="Nama / No Anggota"
                value={filterSearch}
                onChange={(e) => { setFilterSearch(e.target.value); setPage(1) }}
              />
            </div>
            <Button variant="outline" onClick={fetchData} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Cari
            </Button>
            <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
              {generating ? "..." : "Generate Tagihan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Tgl Bayar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {loading ? "Memuat..." : "Tidak ada tagihan"}
                  </TableCell>
                </TableRow>
              )}
              {data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{t.namaAnggota}</div>
                    <div className="text-xs text-muted-foreground">{t.noAnggota}</div>
                  </TableCell>
                  <TableCell>{BULAN[t.bulan]} {t.tahun}</TableCell>
                  <TableCell className="text-right font-mono">Rp{t.nominal.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-xs">{formatTanggal(t.jatuhTempo)}</TableCell>
                  <TableCell className="text-xs">{t.tglBayar ? formatTanggal(t.tglBayar) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[t.status] ?? "outline"}>
                      {STATUS_LABEL[t.status] ?? t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {t.status !== "LUNAS" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirm({
                          title: `Bayar Tagihan ${BULAN[t.bulan]} ${t.tahun}`,
                          desc: `Bayar tagihan simpanan wajib ${t.namaAnggota} periode ${BULAN[t.bulan]} ${t.tahun} sebesar Rp${t.nominal.toLocaleString("id-ID")}?`,
                          onConfirm: () => handleBayar(t),
                        })}
                      >
                        <Wallet className="mr-1 h-3 w-3" /> Bayar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirm?.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {receipt && generalInfo && (
        <StrukPembayaran
          open={!!receipt}
          onOpenChange={(open) => { if (!open) handleCloseReceipt() }}
          generalInfo={generalInfo}
          data={{
            jenis: "tagihan" as const,
            noStruk: receipt.noStruk,
            nominal: receipt.nominal,
            createdAt: receipt.createdAt,
            anggota: receipt.anggota,
            petugas: receipt.petugas,
            bulan: receipt.bulan,
            tahun: receipt.tahun,
          }}
        />
      )}
    </div>
  )
}
