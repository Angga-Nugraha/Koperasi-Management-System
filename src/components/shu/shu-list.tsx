"use client"

/**
 * @file src/components/shu/shu-list.tsx
 * @description Komponen presentasional / interaktif: shu-list.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatRupiah } from "@/lib/format"
import { generateSHU, hapusSHU, getSHUList } from "@/actions/shu"
import { Plus, FileSpreadsheet, FileText, Trash2 } from "lucide-react"

type SHU = Awaited<ReturnType<typeof getSHUList>>[number]

function SHUCard({ shu, onDelete }: { shu: SHU; onDelete: () => void }) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(true)
    setDeleteError("")
    try {
      await hapusSHU(shu.tahun)
      setDeleteOpen(false)
      onDelete()
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => router.push(`/pengurus/shu/${shu.tahun}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {shu.status === "DRAFT" && (
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle>Hapus SHU {shu.tahun}?</DialogTitle>
                    <DialogDescription>
                      SHU draft akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </DialogHeader>
                  {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                      Batal
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Menghapus..." : "Hapus"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Badge variant={shu.status === "FINAL" ? "default" : "secondary"}>
              {shu.status === "FINAL" ? (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Closed
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Estimasi
                </span>
              )}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p
          className={`text-3xl font-bold ${shu.totalSHU >= 0 ? "text-green-600" : "text-red-600"}`}
        >
          {formatRupiah(shu.totalSHU)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Total SHU</p>
      </CardContent>
    </Card>
  )
}

export function SHUList({ data }: { data: SHU[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tahun, setTahun] = useState(`${new Date().getFullYear()}`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleGenerate() {
    setLoading(true)
    setError("")
    try {
      await generateSHU(Number(tahun))
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const tahunSekarang = new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SHU (Sisa Hasil Usaha)</h1>
          <p className="text-sm text-muted-foreground">
            Kelola perhitungan dan alokasi SHU tahunan
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/pengurus/shu/konfigurasi")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Konfigurasi Alokasi
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Generate SHU
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate SHU Baru</DialogTitle>
                <DialogDescription>
                  Hitung SHU untuk tahun tertentu berdasarkan data transaksi.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tahun">Tahun</Label>
                  <Input
                    id="tahun"
                    type="number"
                    min={2020}
                    max={tahunSekarang}
                    value={tahun}
                    onChange={(e) => setTahun(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleGenerate} disabled={loading || !tahun}>
                  {loading ? "Menghitung..." : "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <p className="text-sm text-muted-foreground">Belum ada data SHU</p>
            <p className="text-xs text-muted-foreground">
              Klik &ldquo;Generate SHU&rdquo; untuk memulai
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((shu) => (
            <SHUCard key={shu.id} shu={shu} onDelete={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  )
}
