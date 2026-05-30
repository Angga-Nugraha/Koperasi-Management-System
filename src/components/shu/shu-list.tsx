"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateSHU, getSHUList } from "@/actions/shu"
import { Plus, FileSpreadsheet, CheckCircle2, Clock } from "lucide-react"

type SHU = Awaited<ReturnType<typeof getSHUList>>[number]

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SHU (Sisa Hasil Usaha)</h1>
          <p className="text-sm text-muted-foreground">Kelola perhitungan dan alokasi SHU tahunan</p>
        </div>
        <div className="flex items-center gap-2">
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
            <p className="text-xs text-muted-foreground">Klik "Generate SHU" untuk memulai</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((shu) => (
            <Card key={shu.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(`/pengurus/shu/${shu.tahun}`)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">SHU {shu.tahun}</CardTitle>
                  <Badge variant={shu.status === "FINAL" ? "default" : "secondary"}>
                    {shu.status === "FINAL" ? (
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> FINAL</span>
                    ) : (
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> DRAFT</span>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  Rp {shu.totalSHU.toLocaleString("id-ID")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total SHU</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
