"use client"

/**
 * @file src/components/pinjaman/ajukan-pinjaman-anggota.tsx
 * @description Komponen presentasional / interaktif: ajukan-pinjaman-anggota.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ajukanPinjamanAnggota, getJenisPinjamanList } from "@/actions/pinjaman"

type JenisPinjaman = { id: string; nama: string; bunga: number }

type PlafonInfo = {
  maxPlafon: number
  totalSimpanan: number
  plafonMaxSaldo: number
}

type Props = {
  plafon: PlafonInfo
  onSuccess?: () => void
}

export function AjukanPinjamanAnggota({ plafon, onSuccess }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jenisList, setJenisList] = useState<JenisPinjaman[]>([])
  const [selectedJenis, setSelectedJenis] = useState("")
  const [defaultBunga, setDefaultBunga] = useState(0)
  const [tenorMin, setTenorMin] = useState(3)
  const [tenorMax, setTenorMax] = useState(36)
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    getJenisPinjamanList().then(setJenisList)
    fetch("/api/konfig").then(r => r.json()).then(konfig => {
      if (konfig.tenor_min !== undefined && konfig.tenor_min !== "") setTenorMin(Number(konfig.tenor_min))
      if (konfig.tenor_max !== undefined && konfig.tenor_max !== "") setTenorMax(Number(konfig.tenor_max))
    }).catch(() => {})
  }, [])

  function handleJenisChange(value: string) {
    setSelectedJenis(value)
    const jenis = jenisList.find((j) => j.id === value)
    setDefaultBunga(jenis?.bunga ?? 0)
  }

  async function handleSubmit() {
    setConfirm(null)
    setLoading(true)
    setError(null)

    const form = document.getElementById("ajukan-anggota-form") as HTMLFormElement
    const formData = new FormData(form)
    const jumlah = Number(formData.get("jumlah"))

    if (jumlah > plafon.maxPlafon) {
      setError(`Jumlah pinjaman melebihi plafon. Maksimal Rp${plafon.maxPlafon.toLocaleString("id-ID")}`)
      setLoading(false)
      return
    }

    try {
      await ajukanPinjamanAnggota({
        jenisPinjamanId: formData.get("jenisPinjamanId") as string,
        jumlah,
        tenor: Number(formData.get("tenor")),
        keterangan: (formData.get("keterangan") as string) || null,
      })
      router.refresh()
      setSelectedJenis("")
      setDefaultBunga(0)
      form.reset()
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengajukan pinjaman")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmitClick(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setConfirm({ title: "Ajukan Pinjaman", desc: "Ajukan pinjaman baru?", onConfirm: handleSubmit })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ajukan Pinjaman Baru</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form id="ajukan-anggota-form" onSubmit={handleSubmitClick} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="font-medium">Limit Pinjaman Anda</p>
              <p className="text-lg font-bold text-primary">
                Rp{plafon.maxPlafon.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground">
                {plafon.plafonMaxSaldo}× saldo simpanan (Rp{plafon.totalSimpanan.toLocaleString("id-ID")})
              </p>
            </div>

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

            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Ajukan Pinjaman"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirm?.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
