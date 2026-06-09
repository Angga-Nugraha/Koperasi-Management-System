"use client"

/**
 * @file src/components/simpanan/anggota-simpanan-view.tsx
 * @description Komponen presentasional / interaktif: anggota-simpanan-view.
 */

import { useRouter, useSearchParams } from "next/navigation"
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
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { toast } from "sonner"
import { createOnlinePayment, syncOnlinePaymentStatus } from "@/actions/online-payment"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"

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

type Simpanan = {
  id: string
  jenisKode: string
  jenisNama: string
  saldo: number
}

type Mutasi = {
  id: string
  jenisKode: string
  jenisNama: string
  tipe: string
  nominal: number
  saldoSetelah: number
  keterangan: string | null
  createdAt: string
}

type Tagihan = {
  id: string
  bulan: number
  tahun: number
  nominal: number
  jatuhTempo: string
  tglBayar: string | null
  status: string
}

type Props = {
  simpanan: Simpanan[]
  mutasi: { data: Mutasi[]; total: number; page?: number; totalPages?: number }
  tagihan: Tagihan[]
  pageSize?: number
  pendingPayments?: PendingPayment[]
}

const TIPE_VARIANTS: Record<string, "default" | "destructive"> = {
  SETORAN: "default",
  PENARIKAN: "destructive",
}

const TIPE_LABEL: Record<string, string> = {
  SETORAN: "Setoran",
  PENARIKAN: "Penarikan",
}

const BULAN = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
]

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

export function AnggotaSimpananView({
  simpanan,
  mutasi,
  tagihan,
  pageSize = 20,
  pendingPayments = [],
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalSaldo = simpanan.reduce((s, x) => s + x.saldo, 0)

  const [loadingPayment, setLoadingPayment] = useState<string | null>(null)
  const [sukarelaOpen, setSukarelaOpen] = useState(false)
  const [sukarelaNominal, setSukarelaNominal] = useState("")
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

  const handlePayOnline = async (
    tipe: "TAGIHAN_WAJIB" | "SIMPANAN_SUKARELA",
    relatedId?: string,
    nominalInput?: number,
  ) => {
    const key = relatedId || `sukarela-${nominalInput}`
    setLoadingPayment(key)
    try {
      const res = await createOnlinePayment({ tipe, relatedId, nominalInput })
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

  const years = [...new Set(tagihan.map((t) => t.tahun))].sort((a, b) => b - a)
  const [filterTahun, setFilterTahun] = useState(years[0] ?? new Date().getFullYear())
  const filteredTagihan = tagihan.filter((t) => t.tahun === filterTahun)

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    if (pageSize !== 20) params.set("pageSize", String(pageSize))
    router.push(`/anggota/simpanan?${params.toString()}`)
  }

  function handlePageSizeChange(size: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (size !== 20) params.set("pageSize", String(size))
    else params.delete("pageSize")
    params.delete("page")
    router.push(`/anggota/simpanan?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simpanan Saya</h1>
          <p className="text-sm text-muted-foreground">Ringkasan simpanan Anda</p>
        </div>
        <Button onClick={() => setSukarelaOpen(true)}>Setor Sukarela Online</Button>
      </div>

      {/* Pending Payments Banner */}
      {pendingPayments.length > 0 && (
        <div className="space-y-3">
          {pendingPayments.map((p) => {
            const isSukarela = p.tipe === "SIMPANAN_SUKARELA"
            const label = isSukarela ? "Setoran Simpanan Sukarela" : "Simpanan Wajib"
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
                      Pembayaran Online Tertunda ({label})
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
        {simpanan.map((s) => (
          <Card key={s.jenisKode}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{s.jenisNama}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rp {s.saldo.toLocaleString("id-ID")}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {totalSaldo.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      {tagihan.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tagihan Simpanan Wajib</CardTitle>
              <select
                value={filterTahun}
                onChange={(e) => setFilterTahun(Number(e.target.value))}
                className="h-8 overflow-x-auto rounded-md border bg-background px-2 text-xs"
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Tgl Bayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTagihan.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        {BULAN[t.bulan]} {t.tahun}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        Rp{t.nominal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-xs">{formatTanggal(t.jatuhTempo)}</TableCell>
                      <TableCell className="text-xs">
                        {t.tglBayar ? formatTanggal(t.tglBayar) : "-"}
                      </TableCell>
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
                            onClick={() => handlePayOnline("TAGIHAN_WAJIB", t.id)}
                            disabled={loadingPayment !== null}
                          >
                            {loadingPayment === t.id ? (
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
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mutasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mutasi.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada transaksi
                    </TableCell>
                  </TableRow>
                ) : (
                  mutasi.data.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{formatTanggal(t.createdAt)}</TableCell>
                      <TableCell>{t.jenisNama}</TableCell>
                      <TableCell>
                        <Badge variant={TIPE_VARIANTS[t.tipe] ?? "secondary"}>
                          {TIPE_LABEL[t.tipe] ?? t.tipe}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        Rp {t.nominal.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        Rp {t.saldoSetelah.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={mutasi.page ?? 1}
            totalPages={mutasi.totalPages ?? 0}
            total={mutasi.total}
            pageSize={pageSize}
            onPageChange={goPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </CardContent>
      </Card>

      <Dialog open={sukarelaOpen} onOpenChange={setSukarelaOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Setor Simpanan Sukarela</DialogTitle>
            <DialogDescription>
              Masukkan nominal setoran sukarela. Pembayaran akan diproses secara online melalui
              Midtrans.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nominal">Nominal Setoran (Rp)</Label>
              <Input
                id="nominal"
                type="number"
                placeholder="Contoh: 100000"
                value={sukarelaNominal}
                onChange={(e) => setSukarelaNominal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSukarelaOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={() => {
                const nom = Number(sukarelaNominal)
                if (isNaN(nom) || nom <= 0) {
                  toast.error("Nominal setoran tidak valid")
                  return
                }
                setSukarelaOpen(false)
                handlePayOnline("SIMPANAN_SUKARELA", undefined, nom)
              }}
              disabled={loadingPayment !== null}
            >
              Lanjutkan Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
