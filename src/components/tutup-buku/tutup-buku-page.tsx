"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getSHUTutupBukuList, prosesTutupBuku } from "@/actions/tutup-buku"
import { BookCheck, FileText, AlertTriangle } from "lucide-react"

type SHUItem = Awaited<ReturnType<typeof getSHUTutupBukuList>>[number]

export function TutupBukuPage({ data }: { data: SHUItem[] }) {
  const router = useRouter()
  const [confirmTahun, setConfirmTahun] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  const draftItems = data.filter((s) => s.status === "DRAFT")
  const finalItems = data.filter((s) => s.status === "FINAL")

  async function handleProses() {
    if (!confirmTahun) return
    setProcessing(true)
    setError("")
    try {
      await prosesTutupBuku(confirmTahun)
      setConfirmTahun(null)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tutup Buku</h1>
        <p className="text-sm text-muted-foreground">Proses tutup buku tahunan — jurnal penutup, distribusi SHU anggota, dan distribusi dana</p>
      </div>

      {/* Daftar SHU yang siap ditutup */}
      <Card>
        <CardHeader>
          <CardTitle>Siap Tutup Buku</CardTitle>
        </CardHeader>
        <CardContent>
          {draftItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Tidak ada SHU estimasi yang siap ditutup. Generate SHU terlebih dahulu.</p>
          ) : (
            <div className="space-y-3">
              {draftItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-semibold">SHU {item.tahun}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: Rp {item.totalSHU.toLocaleString("id-ID")} — {item.jumlahAnggota} anggota
                    </p>
                  </div>
                  <Dialog open={confirmTahun === item.tahun} onOpenChange={(open) => {
                    if (!open) setConfirmTahun(null)
                    setError("")
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setConfirmTahun(item.tahun)}>
                        <BookCheck className="mr-2 h-4 w-4" />
                        Proses Tutup Buku
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Tutup Buku {item.tahun}?
                        </DialogTitle>
                        <DialogDescription>
                          Tindakan ini akan:
                        </DialogDescription>
                      </DialogHeader>
                      <ul className="space-y-2 text-sm">
                        <li>✓ Membuat jurnal penutup (reset PENDAPATAN & BEBAN ke 0)</li>
                        <li>✓ Mendistribusikan SHU anggota ke simpanan sukarela</li>
                        <li>✓ Membuat jurnal distribusi dana SHU</li>
                        <li className="font-semibold text-destructive">⚠️ Tidak dapat dibatalkan</li>
                      </ul>
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmTahun(null)}>Batal</Button>
                        <Button onClick={handleProses} disabled={processing}>
                          {processing ? "Memproses..." : "Ya, Tutup Buku"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat SHU final */}
      {finalItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Tutup Buku</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {finalItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      SHU {item.tahun}
                      <Badge variant="default" className="text-xs">
                        <FileText className="mr-1 h-3 w-3" /> Closed
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Total: Rp {item.totalSHU.toLocaleString("id-ID")} — {item.jumlahAnggota} anggota
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push(`/pengurus/shu/${item.tahun}`)}>
                    Lihat Detail
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
