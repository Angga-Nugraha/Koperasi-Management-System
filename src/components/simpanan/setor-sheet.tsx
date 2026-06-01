"use client"

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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { setorSimpanan } from "@/actions/simpanan"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"
import Link from "next/link"

type JenisSimpanan = { id: string; kode: string; nama: string; minimalSetoran: number }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetorSheet({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jenisList, setJenisList] = useState<JenisSimpanan[]>([])
  const [selectedJenis, setSelectedJenis] = useState<string>("")
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)
  const [anggotaId, setAnggotaId] = useState("")

  useEffect(() => {
    fetch("/api/jenis-simpanan").then(r => r.json()).then((list: JenisSimpanan[]) => setJenisList(list.filter((j) => j.kode !== "WAJIB"))).catch(() => {})
  }, [])

  useEffect(() => {
    if (!open) {
      setError(null)
      setLoading(false)
      setSelectedJenis("")
      setConfirm(null)
      setAnggotaId("")
    }
  }, [open])

  const selected = jenisList.find((j) => j.id === selectedJenis)

  async function handleSubmit() {
    setConfirm(null)
    setLoading(true)
    setError(null)

    const form = document.getElementById("setor-form-sheet") as HTMLFormElement
    const formData = new FormData(form)

    try {
      await setorSimpanan({
        anggotaId: formData.get("anggotaId") as string,
        jenisSimpananId: formData.get("jenisSimpananId") as string,
        nominal: Number(formData.get("nominal")),
        keterangan: (formData.get("keterangan") as string) || null,
      })
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmitClick(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setConfirm({ title: "Setor Simpanan", desc: "Simpan setoran simpanan baru?", onConfirm: handleSubmit })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Setor Simpanan</SheetTitle>
            <SheetDescription>Tambah setoran simpanan anggota</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Simpanan Wajib dikelola melalui menu <Link href="/pengurus/simpanan/tagihan" className="font-medium underline underline-offset-2">Tagihan</Link>. Form ini hanya untuk simpanan Pokok dan Sukarela.
            </div>

            <form id="setor-form-sheet" onSubmit={handleSubmitClick} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <AnggotaSelect
                name="anggotaId"
                value={anggotaId}
                onChange={setAnggotaId}
                required
              />

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
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Batal</Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

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
