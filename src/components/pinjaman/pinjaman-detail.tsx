"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  setujuiPinjaman,
  tolakPinjaman,
  cairkanPinjaman,
  bayarAngsuran,
  hapusPinjaman,
} from "@/actions/pinjaman"
import { ArrowLeft, Check, X, Banknote, Wallet, Trash2 } from "lucide-react"
import Link from "next/link"

type Angsuran = {
  id: string
  angsuranKe: number
  jatuhTempo: string
  tglBayar: string | null
  pokok: number
  jasa: number
  denda: number
  total: number
  status: string
}

type Pinjaman = {
  id: string
  noAnggota: string
  namaAnggota: string
  jumlah: number
  tenor: number
  bunga: number
  angsuranPokok: number
  angsuranJasa: number
  angsuranTotal: number
  sisaPinjaman: number
  status: string
  tglPengajuan: string
  tglDisetujui: string | null
  tglDitolak: string | null
  tglCair: string | null
  keterangan: string | null
  createdAt: string
  angsuran: Angsuran[]
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

export function PinjamanDetailClient({ pinjaman }: { pinjaman: Pinjaman }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [bayarNominal, setBayarNominal] = useState("")

  const status = pinjaman.status

  async function handleAction(action: string) {
    setLoading(action)
    setError(null)
    try {
      switch (action) {
        case "setujui":
          await setujuiPinjaman({ pinjamanId: pinjaman.id })
          break
        case "tolak":
          await tolakPinjaman({ pinjamanId: pinjaman.id })
          break
        case "cairkan":
          await cairkanPinjaman({ pinjamanId: pinjaman.id })
          break
        case "hapus":
          await hapusPinjaman({ pinjamanId: pinjaman.id })
          break
        case "bayar":
          await bayarAngsuran({ pinjamanId: pinjaman.id, nominal: Number(bayarNominal) })
          break
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pengurus/pinjaman">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Detail Pinjaman</h1>
          <p className="text-sm text-muted-foreground">
            {pinjaman.noAnggota} — {pinjaman.namaAnggota}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[status] ?? "outline"} className="text-sm">
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Jumlah Pinjaman</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp{pinjaman.jumlah.toLocaleString("id-ID")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sisa Pinjaman</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp{pinjaman.sisaPinjaman.toLocaleString("id-ID")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Angsuran / Bulan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp{pinjaman.angsuranTotal.toLocaleString("id-ID")}</p>
            <p className="text-xs text-muted-foreground">
              Pokok Rp{pinjaman.angsuranPokok.toLocaleString("id-ID")} + Jasa Rp{pinjaman.angsuranJasa.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tenor</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pinjaman.tenor} bulan</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Informasi Pinjaman</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Tgl Pengajuan</dt><dd>{new Date(pinjaman.tglPengajuan).toLocaleDateString("id-ID")}</dd></div>
            <div><dt className="text-muted-foreground">Tgl Disetujui</dt><dd>{pinjaman.tglDisetujui ? new Date(pinjaman.tglDisetujui).toLocaleDateString("id-ID") : "-"}</dd></div>
            <div><dt className="text-muted-foreground">Tgl Dicairkan</dt><dd>{pinjaman.tglCair ? new Date(pinjaman.tglCair).toLocaleDateString("id-ID") : "-"}</dd></div>
            <div><dt className="text-muted-foreground">Bunga</dt><dd>{pinjaman.bunga}% / bulan</dd></div>
            {pinjaman.keterangan && (
              <div className="col-span-2"><dt className="text-muted-foreground">Keterangan</dt><dd>{pinjaman.keterangan}</dd></div>
            )}
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {status === "PENGAJUAN" && (
          <>
            <Button onClick={() => handleAction("setujui")} disabled={loading !== null}>
              <Check className="mr-2 h-4 w-4" /> Setujui
            </Button>
            <Button variant="destructive" onClick={() => handleAction("tolak")} disabled={loading !== null}>
              <X className="mr-2 h-4 w-4" /> Tolak
            </Button>
          </>
        )}
        {status === "DISETUJUI" && (
          <Button onClick={() => handleAction("cairkan")} disabled={loading !== null}>
            <Banknote className="mr-2 h-4 w-4" /> Cairkan
          </Button>
        )}
        {status === "DICAIKKAN" && (
          <div className="flex items-end gap-4">
            <div className="space-y-1">
              <Label htmlFor="bayar">Nominal Bayar (Rp)</Label>
              <Input
                id="bayar"
                type="number"
                placeholder={String(pinjaman.angsuranTotal)}
                value={bayarNominal}
                onChange={(e) => setBayarNominal(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={() => handleAction("bayar")} disabled={loading !== null || !bayarNominal}>
              <Wallet className="mr-2 h-4 w-4" /> Bayar Angsuran
            </Button>
          </div>
        )}
        {(status === "PENGAJUAN" || status === "DISETUJUI") && (
          <Button variant="destructive" onClick={() => handleAction("hapus")} disabled={loading !== null}>
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </Button>
        )}
      </div>

      {pinjaman.angsuran.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Riwayat Angsuran</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ke-</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Pokok</TableHead>
                  <TableHead className="text-right">Jasa</TableHead>
                  <TableHead className="text-right">Denda</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Tgl Bayar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinjaman.angsuran.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.angsuranKe}</TableCell>
                    <TableCell className="text-xs">{new Date(a.jatuhTempo).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp{a.pokok.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp{a.jasa.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp{a.denda.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right font-mono">Rp{a.total.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-xs">{a.tglBayar ? new Date(a.tglBayar).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "LUNAS" ? "default" : "outline"}>
                        {a.status === "LUNAS" ? "Lunas" : "Belum"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
