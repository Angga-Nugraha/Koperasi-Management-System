"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ajukanPinjaman, getJenisPinjamanList } from "@/actions/pinjaman"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type JenisPinjaman = { id: string; nama: string; bunga: number }

export default function AjukanPinjamanPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jenisList, setJenisList] = useState<JenisPinjaman[]>([])
  const [selectedJenis, setSelectedJenis] = useState<string>("")
  const [defaultBunga, setDefaultBunga] = useState<number>(0)
  const [tenorMin, setTenorMin] = useState(3)
  const [tenorMax, setTenorMax] = useState(36)

  useEffect(() => {
    getJenisPinjamanList().then(setJenisList)
    fetch("/api/konfig").then(r => r.json()).then(konfig => {
      if (konfig.tenor_min) setTenorMin(Number(konfig.tenor_min))
      if (konfig.tenor_max) setTenorMax(Number(konfig.tenor_max))
    }).catch(() => {})
  }, [])

  function handleJenisChange(value: string) {
    setSelectedJenis(value)
    const jenis = jenisList.find((j) => j.id === value)
    setDefaultBunga(jenis?.bunga ?? 0)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await ajukanPinjaman({
        anggotaId: formData.get("anggotaId") as string,
        jenisPinjamanId: formData.get("jenisPinjamanId") as string,
        jumlah: Number(formData.get("jumlah")),
        tenor: Number(formData.get("tenor")),
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
              <Label htmlFor="jenisPinjamanId">Jenis Pinjaman *</Label>
              <Select name="jenisPinjamanId" value={selectedJenis} onValueChange={handleJenisChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis pinjaman" />
                </SelectTrigger>
                <SelectContent>
                  {jenisList.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nama} ({j.bunga}%/bln)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bunga">Bunga (% per bulan)</Label>
              <Input id="bunga" value={defaultBunga} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">
                Bunga mengikuti default jenis pinjaman
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jumlah">Jumlah Pinjaman (Rp) *</Label>
              <Input id="jumlah" name="jumlah" type="number" placeholder="0" min="1" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenor">Tenor ({tenorMin}-{tenorMax} bulan) *</Label>
              <Input id="tenor" name="tenor" type="number" placeholder="12" min={tenorMin} max={tenorMax} required />
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
