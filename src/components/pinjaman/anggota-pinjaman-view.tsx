"use client"

/**
 * @file src/components/pinjaman/anggota-pinjaman-view.tsx
 * @description Komponen presentasional / interaktif: anggota-pinjaman-view.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatTanggal } from "@/lib/format"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AjukanPinjamanAnggota } from "./ajukan-pinjaman-anggota"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createOnlinePayment, syncOnlinePaymentStatus } from "@/actions/online-payment"

type PendingPayment = {
  id: string
  orderId: string
  tipe: string
  relatedId: string | null
  nominal: number
  status: string
  snapToken: string | null
  snapUrl: string | null
  expiredAt: string
  createdAt: string
}

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

type PlafonInfo = {
  maxPlafon: number
  totalSimpanan: number
  plafonMaxSaldo: number
}

export function AnggotaPinjamanView({
  pinjaman: data,
  plafon,
  pendingPayments = [],
}: {
  pinjaman: Pinjaman[]
  plafon: PlafonInfo
  pendingPayments?: PendingPayment[]
}) {
  const router = useRouter()
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const getSisaWaktuText = (expiredAtStr: string) => {
    const exp = new Date(expiredAtStr).getTime()
    const diff = exp - now
    if (diff <= 0) return "Kedaluwarsa"
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    return `${hours}j ${minutes}m ${seconds}d`
  }

  const handlePayOnline = async (relatedId: string) => {
    setLoadingPayment(relatedId)
    try {
      const res = await createOnlinePayment({ tipe: "ANGSURAN", relatedId })
      if (!res.success && res.code === "PENDING_PAYMENT_EXISTS") {
        toast.error(res.message)
        if (res.data?.snapToken) {
          triggerSnap(res.data.snapToken, res.data.orderId)
        }
        return
      }

      if (res.success && res.data?.snapToken) {
        triggerSnap(res.data.snapToken, res.data.orderId)
      } else {
        toast.error("Gagal membuat kode pembayaran.")
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses pembayaran.")
    } finally {
      setLoadingPayment(null)
    }
  }

  const triggerSnap = (token: string, orderId: string) => {
    if (!(window as any).snap) {
      toast.error("Midtrans payment library is not loaded yet. Please wait a moment.")
      return
    }
    ;(window as any).snap.pay(token, {
      onSuccess: async () => {
        toast.success("Pembayaran berhasil!")
        await syncOnlinePaymentStatus(orderId)
        router.refresh()
      },
      onPending: () => {
        toast.info("Pembayaran tertunda. Silakan selesaikan pembayaran Anda.")
        router.refresh()
      },
      onError: () => {
        toast.error("Pembayaran gagal.")
      },
      onClose: () => {
        toast.info("Pembayaran belum diselesaikan.")
        router.refresh()
      },
    })
  }

  const handleSyncStatus = async (orderId: string) => {
    setLoadingPayment(orderId)
    try {
      const res = await syncOnlinePaymentStatus(orderId)
      if (res.success) {
        toast.success(`Status transaksi diperbarui: ${res.status}`)
        router.refresh()
      } else {
        toast.error("Gagal memperbarui status transaksi")
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi status")
    } finally {
      setLoadingPayment(null)
    }
  }

  const aktif = data.filter(
    (p) => p.status !== "LUNAS" && p.status !== "DITOLAK" && p.status !== "GAGAL",
  )
  const totalSisa = aktif.reduce((sum, p) => sum + p.sisaPinjaman, 0)
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pinjaman Saya</h1>
        <p className="text-sm text-muted-foreground">Riwayat pinjaman Anda di koperasi</p>
      </div>

      {/* Pending Payments Banner */}
      {pendingPayments.length > 0 && (
        <div className="space-y-3">
          {pendingPayments.map((p) => {
            const sisaWaktu = getSisaWaktuText(p.expiredAt)
            if (sisaWaktu === "Kedaluwarsa") return null

            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <h5 className="font-semibold text-amber-900">
                      Pembayaran Online Tertunda (Angsuran Pinjaman)
                    </h5>
                    <p className="text-sm text-amber-700">
                      Anda menginisiasi pembayaran sebesar{" "}
                      <span className="font-bold">Rp {p.nominal.toLocaleString("id-ID")}</span>.
                      Selesaikan sebelum kedaluwarsa dalam{" "}
                      <span className="font-bold text-amber-900">{sisaWaktu}</span>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => handleSyncStatus(p.orderId)}
                    disabled={loadingPayment === p.orderId}
                  >
                    {loadingPayment === p.orderId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Cek Status"
                    )}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white border-0"
                    onClick={() => triggerSnap(p.snapToken!, p.orderId)}
                  >
                    Selesaikan Pembayaran
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pinjaman Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{aktif.length} pinjaman</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sisa Pinjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp{totalSisa.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Angsuran per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp{aktif.reduce((sum, p) => sum + p.angsuranTotal, 0).toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-primary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Limit Pinjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              Rp{plafon.maxPlafon.toLocaleString("id-ID")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {plafon.plafonMaxSaldo}× saldo simpanan (Rp
              {plafon.totalSimpanan.toLocaleString("id-ID")})
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Tutup" : "Ajukan Pinjaman"}
        </Button>
      </div>

      {showForm && <AjukanPinjamanAnggota plafon={plafon} onSuccess={() => setShowForm(false)} />}

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
                <Badge className={STATUS_STYLE[p.status]}>
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

              {p.keterangan && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Catatan:</span>
                  <p className="whitespace-pre-wrap">{p.keterangan}</p>
                </div>
              )}

              {p.angsuran.length > 0 && (
                <div className="overflow-x-auto rounded-md border">
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
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {p.angsuran.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>{a.angsuranKe}</TableCell>
                          <TableCell className="text-xs">{formatTanggal(a.jatuhTempo)}</TableCell>
                          <TableCell className="text-right font-mono">
                            Rp{a.pokok.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            Rp{a.jasa.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            Rp{a.total.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="text-xs">
                            {a.tglBayar ? formatTanggal(a.tglBayar) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.status === "LUNAS" ? "default" : "outline"}>
                              {a.status === "LUNAS" ? "Lunas" : "Belum"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {a.status !== "LUNAS" && p.status === "DICAIRKAN" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePayOnline(a.id)}
                                disabled={loadingPayment !== null}
                              >
                                {loadingPayment === a.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  "Bayar Online"
                                )}
                              </Button>
                            )}
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
