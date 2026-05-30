"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { tarikSimpanan } from "@/actions/simpanan"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function TarikSimpananPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselected = searchParams.get("anggotaId") ?? ""
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await tarikSimpanan({
        anggotaId: formData.get("anggotaId") as string,
        jenis: "SUKARELA",
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
          <h1 className="text-2xl font-bold tracking-tight">Tarik Simpanan</h1>
          <p className="text-sm text-muted-foreground">Penarikan simpanan sukarela anggota</p>
        </div>
      </div>

      <Card className="max-w-lg">
        <CardHeader><CardTitle>Form Penarikan</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <AnggotaSelect name="anggotaId" value={preselected} required />

            <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Hanya simpanan sukarela yang bisa ditarik. Simpanan pokok dan wajib hanya dapat ditarik
              saat anggota keluar dari keanggotaan koperasi.
            </div>

            <input type="hidden" name="jenis" value="SUKARELA" />

            <div className="space-y-2">
              <Label htmlFor="nominal">Nominal (Rp) *</Label>
              <Input id="nominal" name="nominal" type="number" placeholder="0" min="1" required />
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
