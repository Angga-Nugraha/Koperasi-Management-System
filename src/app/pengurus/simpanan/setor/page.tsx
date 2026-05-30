"use client"

import { useRouter, useSearchParams } from "next/navigation"
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
import { setorSimpanan } from "@/actions/simpanan"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type JenisSimpanan = { id: string; kode: string; nama: string; minimalSetoran: number }

export default function SetorSimpananPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get("anggotaId") ?? ""
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jenisList, setJenisList] = useState<JenisSimpanan[]>([])
  const [selectedJenis, setSelectedJenis] = useState<string>("")

  useEffect(() => {
    fetch("/api/jenis-simpanan").then(r => r.json()).then(setJenisList).catch(() => {})
  }, [])

  const selected = jenisList.find((j) => j.id === selectedJenis)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await setorSimpanan({
        anggotaId: formData.get("anggotaId") as string,
        jenisSimpananId: formData.get("jenisSimpananId") as string,
        nominal: Number(formData.get("nominal")),
        keterangan: (formData.get("keterangan") as string) || null,
      })
      router.push("/pengurus/simpanan")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pengurus/simpanan">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Setor Simpanan</h1>
          <p className="text-sm text-muted-foreground">Tambah setoran simpanan anggota</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>Form Setoran</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <AnggotaSelect name="anggotaId" value={preselected} required />

            <div className="space-y-2">
              <Label htmlFor="jenisSimpananId">Jenis Simpanan *</Label>
              <Select name="jenisSimpananId" value={selectedJenis} onValueChange={setSelectedJenis} required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {jenisList.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.nama} ({j.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal (Rp) *</Label>
              <Input id="nominal" name="nominal" type="number" placeholder="0" min={selected?.minimalSetoran ?? 1} required />
              {selected && selected.minimalSetoran > 0 && (
                <p className="text-xs text-muted-foreground">
                  Minimal setoran: Rp{selected.minimalSetoran.toLocaleString("id-ID")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea id="keterangan" name="keterangan" placeholder="Opsional" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Menyimpan..." : "Simpan"}</Button>
              <Button variant="outline" asChild>
                <Link href="/pengurus/simpanan">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
