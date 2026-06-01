"use client"

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
  jenisPinjaman: string
  jumlah: number
  tenor: number
  bunga: number
  angsuranPokok: number
  angsuranJasa: number
  angsuranTotal: number
  sisaPinjaman: number
  status: string
  tglPengajuan: string
  tglCair: string | null
  keterangan: string | null
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

export function AnggotaPinjamanView({ pinjaman: data }: { pinjaman: Pinjaman[] }) {
  const aktif = data.filter((p) => p.status !== "LUNAS" && p.status !== "DITOLAK" && p.status !== "GAGAL")
  const totalSisa = aktif.reduce((sum, p) => sum + p.sisaPinjaman, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pinjaman Saya</h1>
        <p className="text-sm text-muted-foreground">Riwayat pinjaman Anda di koperasi</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Pinjaman Aktif</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{aktif.length} pinjaman</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Sisa Pinjaman</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">Rp{totalSisa.toLocaleString("id-ID")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Angsuran per Bulan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp{aktif.reduce((sum, p) => sum + p.angsuranTotal, 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Belum ada data pinjaman
          </CardContent>
        </Card>
      ) : (
        data.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Pinjaman Rp{p.jumlah.toLocaleString("id-ID")}
                </CardTitle>
                <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div>
                  <span className="text-muted-foreground">Jenis</span>
                  <p className="font-medium">{p.jenisPinjaman}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tenor</span>
                  <p className="font-medium">{p.tenor} bulan</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bunga</span>
                  <p className="font-medium">{p.bunga}% / bln</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Jenis</span>
                  <p className="font-medium">{p.jenisPinjaman}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Angsuran / bln</span>
                  <p className="font-medium">Rp{p.angsuranTotal.toLocaleString("id-ID")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sisa</span>
                  <p className="font-medium">Rp{p.sisaPinjaman.toLocaleString("id-ID")}</p>
                </div>
              </div>

              {p.angsuran.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ke-</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Pokok</TableHead>
                        <TableHead className="text-right">Jasa</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Tgl Bayar</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {p.angsuran.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.angsuranKe}</TableCell>
                          <TableCell className="text-xs">{formatTanggal(a.jatuhTempo)}</TableCell>
                          <TableCell className="text-right font-mono">Rp{a.pokok.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right font-mono">Rp{a.jasa.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-right font-mono">Rp{a.total.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="text-xs">{a.tglBayar ? formatTanggal(a.tglBayar) : "-"}</TableCell>
                          <TableCell>
                            <Badge variant={a.status === "LUNAS" ? "default" : "outline"}>
                              {a.status === "LUNAS" ? "Lunas" : "Belum"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
