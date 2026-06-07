"use client"

/**
 * @file src/components/simpanan/tarik-sheet.tsx
 * @description Komponen presentasional / interaktif: tarik-sheet.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { tarikSimpanan } from "@/actions/simpanan"
import { AnggotaSelect } from "@/components/simpanan/anggota-select"
import { StrukPembayaran } from "@/components/struk-pembayaran"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TarikSheet({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jenisSukarelaId, setJenisSukarelaId] = useState<string>("")
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)
  const [anggotaId, setAnggotaId] = useState("")
  const [generalInfo, setGeneralInfo] = useState<{ namaKoperasi: string; alamat: string | null; noAhu: string | null; logo: string | null } | null>(null)
  const [receipt, setReceipt] = useState<{
    noStruk: string
    tipe: "PENARIKAN"
    nominal: number
    keterangan: string | null
    createdAt: string
    anggota: { nama: string; noAnggota: string }
    jenisSimpanan: { nama: string; kode: string }
    petugas: string
  } | null>(null)

  useEffect(() => {
    fetch("/api/jenis-simpanan").then(r => r.json()).then((list: Array<{ id: string; kode: string }>) => {
      const sukarela = list.find((j) => j.kode === "SUKARELA")
      if (sukarela) setJenisSukarelaId(sukarela.id)
    }).catch(() => {})
    fetch("/api/general-info").then(r => r.json()).then(setGeneralInfo).catch(() => {})
  }, [])

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null)
      setLoading(false)
      setConfirm(null)
      setAnggotaId("")
    }
    onOpenChange(open)
  }

  async function handleSubmit() {
    setConfirm(null)
    setLoading(true)
    setError(null)

    const form = document.getElementById("tarik-form-sheet") as HTMLFormElement
    const formData = new FormData(form)

    try {
      const result = await tarikSimpanan({
        anggotaId: formData.get("anggotaId") as string,
        jenisSimpananId: jenisSukarelaId,
        nominal: Number(formData.get("nominal")),
        keterangan: (formData.get("keterangan") as string) || null,
      })
      if (result.success && result.data) {
        setReceipt({
          noStruk: result.data.noStruk,
          tipe: "PENARIKAN",
          nominal: result.data.nominal,
          keterangan: result.data.keterangan,
          createdAt: result.data.createdAt,
          anggota: result.data.anggota,
          jenisSimpanan: result.data.jenisSimpanan,
          petugas: result.data.petugas,
        })
      }
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
    setConfirm({ title: "Tarik Simpanan", desc: "Proses penarikan simpanan?", onConfirm: handleSubmit })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tarik Simpanan</SheetTitle>
            <SheetDescription>Penarikan simpanan sukarela anggota</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <form id="tarik-form-sheet" onSubmit={handleSubmitClick} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <AnggotaSelect
                name="anggotaId"
                value={anggotaId}
                onChange={setAnggotaId}
                required
              />

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

      {receipt && generalInfo && (
        <StrukPembayaran
          open={!!receipt}
          onOpenChange={() => setReceipt(null)}
          generalInfo={generalInfo}
          data={{ ...receipt, jenis: "simpanan" as const }}
        />
      )}
    </>
  )
}
