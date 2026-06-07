"use client"

/**
 * @file src/components/pinjaman/pinjaman-detail.tsx
 * @description Komponen presentasional / interaktif: pinjaman-detail.
 */

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  setujuiPinjaman,
  tolakPinjaman,
  cairkanPinjaman,
  bayarAngsuranKe,
  hapusPinjaman,
} from "@/actions/pinjaman"
import { ArrowLeft, Check, X, Banknote, Trash2, Wallet } from "lucide-react"
import {formatTanggal} from "@/lib/format"
import { StrukPembayaran } from "@/components/struk-pembayaran"

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
  DICAIRKAN: "Dicairkan",
  LUNAS: "Lunas",
  GAGAL: "Gagal",
}

const STATUS_STYLE: Record<string, string> = {
  PENGAJUAN: "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-50/80",
  DISETUJUI: "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-50/80",
  DITOLAK: "border-red-300 text-red-700 bg-red-50 hover:bg-red-50/80",
  DICAIRKAN: "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-50/80",
  LUNAS: "border-green-300 text-green-700 bg-green-50 hover:bg-green-50/80",
  GAGAL: "border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-50/80",
}

export function PinjamanDetailClient({ pinjaman }: { pinjaman: Pinjaman }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)
  const [verifKet, setVerifKet] = useState("")
  const [generalInfo, setGeneralInfo] = useState<{ namaKoperasi: string; alamat: string | null; noAhu: string | null; logo: string | null } | null>(null)
  const [receipt, setReceipt] = useState<{
    noStruk: string
    angsuranKe: number
    pokok: number
    jasa: number
    denda: number
    total: number
    tglBayar: string
    anggota: { nama: string; noAnggota: string }
    pinjaman: { id: string; jumlah: number; sisaPinjaman: number; isLunas: boolean }
    petugas: string
  } | null>(null)

  useEffect(() => {
    fetch("/api/general-info").then(r => r.json()).then(setGeneralInfo).catch((err) => {
      console.error("Failed to fetch general info:", err)
    })
  }, [])

  const status = pinjaman.status

  async function handleAction(action: string) {
    setConfirm(null)
    setLoading(action)
    setError(null)
    try {
      switch (action) {
        case "setujui":
          await setujuiPinjaman({ pinjamanId: pinjaman.id, keterangan: verifKet || null })
          break
        case "tolak":
          await tolakPinjaman({ pinjamanId: pinjaman.id, keterangan: verifKet || null })
          break
        case "cairkan":
          await cairkanPinjaman({ pinjamanId: pinjaman.id })
          break
        case "hapus":
          await hapusPinjaman({ pinjamanId: pinjaman.id })
          break
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses")
    } finally {
      setLoading(null)
    }
  }

  async function handleBayar(angsuranKe: number) {
    setConfirm(null)
    setLoading(`bayar-${angsuranKe}`)
    setError(null)
    try {
      const result = await bayarAngsuranKe({ pinjamanId: pinjaman.id, angsuranKe })
      if (result.success && result.data) {
        setReceipt(result.data)
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
          <p className="text-xs text-muted-foreground">{pinjaman.jenisPinjaman} ({pinjaman.bunga}%/bln)</p>
        </div>
        <Badge className={`${STATUS_STYLE[status] ?? ""} text-sm`}>
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
            <div><dt className="text-muted-foreground">Tgl Pengajuan</dt><dd>{formatTanggal(pinjaman.tglPengajuan)}</dd></div>
            <div><dt className="text-muted-foreground">Tgl Disetujui</dt><dd>{pinjaman.tglDisetujui ? formatTanggal(pinjaman.tglDisetujui) : "-"}</dd></div>
            <div><dt className="text-muted-foreground">Jenis Pinjaman</dt><dd>{pinjaman.jenisPinjaman}</dd></div>
            <div><dt className="text-muted-foreground">Tgl Dicairkan</dt><dd>{pinjaman.tglCair ? formatTanggal(pinjaman.tglCair) : "-"}</dd></div>
            <div><dt className="text-muted-foreground">Bunga</dt><dd>{pinjaman.bunga}% / bulan</dd></div>
          </dl>
        </CardContent>
      </Card>

      {status === "PENGAJUAN" && (
        <Card>
          <CardHeader><CardTitle>Verifikasi Pinjaman</CardTitle></CardHeader>
          <CardContent>
            <textarea
              className="w-full rounded-md border p-2 text-sm"
              rows={3}
              placeholder="Catatan verifikasi (opsional) — alasan penolakan atau informasi tambahan persetujuan"
              value={verifKet}
              onChange={(e) => setVerifKet(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {pinjaman.keterangan && (
        <Card>
          <CardHeader><CardTitle>Catatan</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{pinjaman.keterangan}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {status === "PENGAJUAN" && (
          <>
            <Button onClick={() => setConfirm({ title: "Setujui Pinjaman", desc: `Setujui pinjaman ${pinjaman.noAnggota} sebesar Rp${pinjaman.jumlah.toLocaleString("id-ID")}?`, onConfirm: () => handleAction("setujui") })} disabled={loading !== null}>
              <Check className="mr-2 h-4 w-4" /> Setujui
            </Button>
            <Button variant="destructive" onClick={() => setConfirm({ title: "Tolak Pinjaman", desc: `Tolak pengajuan pinjaman ${pinjaman.noAnggota}?`, onConfirm: () => handleAction("tolak") })} disabled={loading !== null}>
              <X className="mr-2 h-4 w-4" /> Tolak
            </Button>
          </>
        )}
        {status === "DISETUJUI" && (
          <Button onClick={() => setConfirm({ title: "Cairkan Pinjaman", desc: `Cairkan pinjaman ${pinjaman.noAnggota} sebesar Rp${pinjaman.jumlah.toLocaleString("id-ID")}?`, onConfirm: () => handleAction("cairkan") })} disabled={loading !== null}>
            <Banknote className="mr-2 h-4 w-4" /> Cairkan
          </Button>
        )}
        {status === "DICAIRKAN" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Klik tombol <strong>Bayar</strong> pada angsuran yang ingin dibayarkan
          </div>
        )}
        {(status === "PENGAJUAN" || status === "DISETUJUI") && (
          <Button variant="destructive" onClick={() => setConfirm({ title: "Hapus Pinjaman", desc: `Hapus pinjaman ${pinjaman.noAnggota}? Tindakan ini tidak dapat dikembalikan.`, onConfirm: () => handleAction("hapus") })} disabled={loading !== null}>
            <Trash2 className="mr-2 h-4 w-4" /> Hapus
          </Button>
        )}
      </div>

      {pinjaman.angsuran.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Riwayat Angsuran</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ke-</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead className="text-right">Pokok</TableHead>
                  <TableHead className="text-right">Jasa</TableHead>
                  <TableHead className="text-right">Denda</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  <TableHead>Tgl Bayar</TableHead>
                  <TableHead>Status</TableHead>
                  {status === "DICAIRKAN" && <TableHead>Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let sisa = pinjaman.jumlah
                  return pinjaman.angsuran.map((a) => {
                    const pokokDibayar = a.status === "LUNAS" || a.status === "TERLAMBAT" ? a.pokok : 0
                    sisa -= pokokDibayar
                    return (
                      <TableRow key={a.id}>
                        <TableCell>{a.angsuranKe}</TableCell>
                        <TableCell className="text-xs">{formatTanggal(a.jatuhTempo)}</TableCell>
                        <TableCell className="text-right font-mono">Rp{a.pokok.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono">Rp{a.jasa.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono">Rp{a.denda.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono">Rp{a.total.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right font-mono">Rp{Math.max(0, sisa).toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-xs">{a.tglBayar ? formatTanggal(a.tglBayar) : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={a.status === "LUNAS" ? "default" : "outline"}>
                            {a.status === "LUNAS" ? "Lunas" : a.status === "TERLAMBAT" ? "Terlambat" : "Belum"}
                          </Badge>
                        </TableCell>
                        {status === "DICAIRKAN" && (
                          <TableCell>
                            {a.status !== "LUNAS" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirm({ title: `Bayar Angsuran #${a.angsuranKe}`, desc: `Bayar angsuran ke-${a.angsuranKe} sebesar Rp${a.total.toLocaleString("id-ID")} (Pokok Rp${a.pokok.toLocaleString("id-ID")} + Jasa Rp${a.jasa.toLocaleString("id-ID")}${a.denda > 0 ? ` + Denda Rp${a.denda.toLocaleString("id-ID")}` : ""})?`, onConfirm: () => handleBayar(a.angsuranKe) })}
                                disabled={loading === `bayar-${a.angsuranKe}`}
                              >
                                <Wallet className="mr-1 h-3 w-3" />
                                {loading === `bayar-${a.angsuranKe}` ? "..." : "Bayar"}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                })()}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
          onOpenChange={(open) => { if (!open) setReceipt(null) }}
          generalInfo={generalInfo}
          data={{
            jenis: "angsuran",
            noStruk: receipt.noStruk,
            angsuranKe: receipt.angsuranKe,
            pokok: receipt.pokok,
            jasa: receipt.jasa,
            denda: receipt.denda,
            total: receipt.total,
            tglBayar: receipt.tglBayar,
            anggota: receipt.anggota,
            pinjaman: receipt.pinjaman,
            petugas: receipt.petugas,
          }}
        />
      )}
    </div>
  )
}
