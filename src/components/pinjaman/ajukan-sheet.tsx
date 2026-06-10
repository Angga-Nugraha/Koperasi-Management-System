"use client"

/**
 * @file src/components/pinjaman/ajukan-sheet.tsx
 * @description Komponen presentasional / interaktif: ajukan-sheet.
 */

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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ajukanPinjaman, getJenisPinjamanList, getPlafonAnggota } from "@/actions/pinjaman"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"

type JenisPinjaman = { id: string; nama: string; bunga: number }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AjukanSheet({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jenisList, setJenisList] = useState<JenisPinjaman[]>([])
  const [selectedJenis, setSelectedJenis] = useState<string>("")
  const [defaultBunga, setDefaultBunga] = useState<number>(0)
  const [tenorMin, setTenorMin] = useState(3)
  const [tenorMax, setTenorMax] = useState(36)
  const [confirm, setConfirm] = useState<{
    title: string
    desc: string
    onConfirm: () => void
  } | null>(null)
  const [anggotaId, setAnggotaId] = useState("")
  const [plafon, setPlafon] = useState<{
    maxPlafon: number
    totalSimpanan: number
    plafonMaxSaldo: number
  } | null>(null)
  const [loadingPlafon, setLoadingPlafon] = useState(false)

  useEffect(() => {
    getJenisPinjamanList().then(setJenisList)
    fetch("/api/konfig")
      .then((r) => r.json())
      .then((konfig) => {
        if (konfig.tenor_min !== undefined && konfig.tenor_min !== "")
          setTenorMin(Number(konfig.tenor_min))
        if (konfig.tenor_max !== undefined && konfig.tenor_max !== "")
          setTenorMax(Number(konfig.tenor_max))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const id = setTimeout(() => {
      if (!anggotaId) {
        setPlafon(null)
        return
      }
      setLoadingPlafon(true)
      getPlafonAnggota(anggotaId)
        .then(setPlafon)
        .catch(() => setPlafon(null))
        .finally(() => setLoadingPlafon(false))
    }, 0)
    return () => clearTimeout(id)
  }, [anggotaId])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null)
      setLoading(false)
      setSelectedJenis("")
      setDefaultBunga(0)
      setConfirm(null)
      setAnggotaId("")
      setPlafon(null)
    }
    onOpenChange(open)
  }

  function handleJenisChange(value: string) {
    setSelectedJenis(value)
    const jenis = jenisList.find((j) => j.id === value)
    setDefaultBunga(jenis?.bunga ?? 0)
  }

  async function handleSubmit() {
    setConfirm(null)
    setLoading(true)
    setError(null)

    const form = document.getElementById("ajukan-form-sheet") as HTMLFormElement
    const formData = new FormData(form)

    const jumlah = Number(formData.get("jumlah"))
    if (plafon && jumlah > plafon.maxPlafon) {
      setError(
        `Jumlah pinjaman melebihi plafon. Maksimal Rp${plafon.maxPlafon.toLocaleString("id-ID")}`,
      )
      setLoading(false)
      return
    }

    try {
      await ajukanPinjaman({
        anggotaId: formData.get("anggotaId") as string,
        jenisPinjamanId: formData.get("jenisPinjamanId") as string,
        jumlah,
        tenor: Number(formData.get("tenor")),
        keterangan: (formData.get("keterangan") as string) || null,
      })
      onOpenChange(false)
      router.refresh()
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
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ajukan Pinjaman</SheetTitle>
            <SheetDescription>Buat pengajuan pinjaman baru untuk anggota</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <form id="ajukan-form-sheet" onSubmit={handleSubmitClick} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <AnggotaSelect name="anggotaId" value={anggotaId} onChange={setAnggotaId} required />

              {plafon && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p className="font-medium">Limit Pinjaman Maksimal</p>
                  <p className="text-lg font-bold text-primary">
                    Rp{plafon.maxPlafon.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {plafon.plafonMaxSaldo}× saldo simpanan (Rp
                    {plafon.totalSimpanan.toLocaleString("id-ID")})
                  </p>
                </div>
              )}
              {loadingPlafon && (
                <p className="text-xs text-muted-foreground">Memuat limit pinjaman...</p>
              )}

              <div className="space-y-2">
                <Label htmlFor="jenisPinjamanId">Jenis Pinjaman *</Label>
                <Select
                  name="jenisPinjamanId"
                  value={selectedJenis}
                  onValueChange={handleJenisChange}
                  required
                >
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
                <Label htmlFor="tenor">
                  Tenor ({tenorMin}-{tenorMax} bulan) *
                </Label>
                <Input
                  id="tenor"
                  name="tenor"
                  type="number"
                  placeholder="12"
                  min={tenorMin}
                  max={tenorMax}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Textarea id="keterangan" name="keterangan" placeholder="Opsional" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Ajukan"}
                </Button>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
      >
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
