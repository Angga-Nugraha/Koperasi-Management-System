"use client"

import { useState } from "react"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateAnggota } from "@/actions/anggota"
import { X } from "lucide-react"

type AnggotaData = {
  id: string
  nik: string
  noAnggota: string
  nama: string
  noHp: string | null
  jenisKelamin: string | null
  alamat: string
  pekerjaan: string | null
  penghasilan: number | null
  foto: string | null
  ktp: string | null
  tglMasuk: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  anggota: AnggotaData
}

export function EditAnggotaSheet({ open, onOpenChange, anggota }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [foto, setFoto] = useState<string | null>(anggota.foto)
  const [ktp, setKtp] = useState<string | null>(anggota.ktp)
  const [fotoUploading, setFotoUploading] = useState(false)
  const [ktpUploading, setKtpUploading] = useState(false)
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)

  async function uploadFile(file: File, type: "foto" | "ktp"): Promise<string> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", type)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? "Gagal upload")
    }
    const data = await res.json()
    return data.url
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoUploading(true)
    try {
      const url = await uploadFile(file, "foto")
      setFoto(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload foto")
    } finally {
      setFotoUploading(false)
    }
  }

  async function handleKtpUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setKtpUploading(true)
    try {
      const url = await uploadFile(file, "ktp")
      setKtp(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload KTP")
    } finally {
      setKtpUploading(false)
    }
  }

  async function handleSubmit() {
    setConfirm(null)
    setLoading(true)
    setError(null)

    const form = document.getElementById("edit-anggota-form-sheet") as HTMLFormElement
    const formData = new FormData(form)

    try {
      await updateAnggota({
        id: anggota.id,
        nik: anggota.nik,
        nama: formData.get("nama") as string,
        noHp: (formData.get("noHp") as string) || undefined,
        jenisKelamin: (formData.get("jenisKelamin") as string) || undefined,
        alamat: formData.get("alamat") as string,
        pekerjaan: (formData.get("pekerjaan") as string) || undefined,
        penghasilan: formData.get("penghasilan") ? Number(formData.get("penghasilan")) : null,
        foto,
        ktp,
        tglMasuk: formData.get("tglMasuk") as string,
        buatUser: false,
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
    setConfirm({ title: "Edit Anggota", desc: "Simpan perubahan data anggota?", onConfirm: handleSubmit })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Anggota</SheetTitle>
            <SheetDescription>{anggota.noAnggota}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <form id="edit-anggota-form-sheet" onSubmit={handleSubmitClick} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nik">NIK</Label>
                <Input id="nik" value={anggota.nik} readOnly disabled />
                <p className="text-xs text-muted-foreground">NIK tidak dapat diubah</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input id="nama" name="nama" defaultValue={anggota.nama} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noHp">No. HP</Label>
                <Input id="noHp" name="noHp" defaultValue={anggota.noHp ?? ""} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                <Select name="jenisKelamin" defaultValue={anggota.jenisKelamin ?? undefined}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                    <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat *</Label>
                <Textarea id="alamat" name="alamat" defaultValue={anggota.alamat} required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pekerjaan">Pekerjaan</Label>
                  <Input id="pekerjaan" name="pekerjaan" defaultValue={anggota.pekerjaan ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penghasilan">Penghasilan (Rp)</Label>
                  <Input
                    id="penghasilan"
                    name="penghasilan"
                    type="number"
                    defaultValue={anggota.penghasilan ?? ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Foto</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFotoUpload}
                      disabled={fotoUploading}
                      className="file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {fotoUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                  </div>
                  {foto && (
                    <div className="relative mt-2 inline-block">
                      <img src={foto} alt="Foto preview" className="h-20 w-16 rounded border object-cover" />
                      <button
                        type="button"
                        onClick={() => setFoto(null)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>KTP</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleKtpUpload}
                      disabled={ktpUploading}
                      className="file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    {ktpUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
                  </div>
                  {ktp && (
                    <div className="relative mt-2 inline-block">
                      <img src={ktp} alt="KTP preview" className="h-20 w-32 rounded border object-cover" />
                      <button
                        type="button"
                        onClick={() => setKtp(null)}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tglMasuk">Tanggal Masuk *</Label>
                <Input
                  id="tglMasuk"
                  name="tglMasuk"
                  type="date"
                  defaultValue={anggota.tglMasuk.slice(0, 10)}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading || fotoUploading || ktpUploading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
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
