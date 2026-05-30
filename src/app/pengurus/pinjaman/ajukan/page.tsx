"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ajukanPinjaman } from "@/actions/pinjaman"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AjukanPinjamanPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await ajukanPinjaman({
        anggotaId: formData.get("anggotaId") as string,
        jumlah: Number(formData.get("jumlah")),
        tenor: Number(formData.get("tenor")),
        bunga: Number(formData.get("bunga")),
        keterangan: (formData.get("keterangan") as string) || null,
      })
      router.push("/pengurus/pinjaman")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan pinjaman")
    } finally {
      setLoading(false)
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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ajukan Pinjaman</h1>
          <p className="text-sm text-muted-foreground">Buat pengajuan pinjaman baru untuk anggota</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>Form Pengajuan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <AnggotaSelect name="anggotaId" required />

            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah Pinjaman (Rp) *</Label>
              <Input id="jumlah" name="jumlah" type="number" placeholder="0" min="1" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenor">Tenor (bulan) *</Label>
              <Input id="tenor" name="tenor" type="number" placeholder="12" min="1" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bunga">Bunga (% per bulan) *</Label>
              <Input id="bunga" name="bunga" type="number" placeholder="2" min="0" step="0.1" required />
              <p className="text-xs text-muted-foreground">
                Bunga flat per bulan. Contoh: 2 berarti 2% per bulan dari jumlah pinjaman.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea id="keterangan" name="keterangan" placeholder="Opsional" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Ajukan"}</Button>
              <Button variant="outline" asChild>
                <Link href="/pengurus/pinjaman">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
