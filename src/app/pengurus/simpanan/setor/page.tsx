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

export default function SetorSimpananPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get("anggotaId") ?? ""
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [simpananPokok, setSimpananPokok] = useState(100000)
  const [simpananWajib, setSimpananWajib] = useState(50000)

  useEffect(() => {
    fetch("/api/konfig").then(r => r.json()).then(konfig => {
      if (konfig.simpanan_pokok) setSimpananPokok(Number(konfig.simpanan_pokok))
      if (konfig.simpanan_wajib_perbulan) setSimpananWajib(Number(konfig.simpanan_wajib_perbulan))
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await setorSimpanan({
        anggotaId: formData.get("anggotaId") as string,
        jenis: formData.get("jenis") as "POKOK" | "WAJIB" | "SUKARELA",
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
              <Label htmlFor="jenis">Jenis Simpanan *</Label>
              <Select name="jenis" required>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POKOK">Pokok</SelectItem>
                  <SelectItem value="WAJIB">Wajib</SelectItem>
                  <SelectItem value="SUKARELA">Sukarela</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal (Rp) *</Label>
              <Input id="nominal" name="nominal" type="number" placeholder="0" min="1" required />
              <p className="text-xs text-muted-foreground">
                Min: Pokok Rp{simpananPokok.toLocaleString("id-ID")} | Wajib Rp{simpananWajib.toLocaleString("id-ID")}
              </p>
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
