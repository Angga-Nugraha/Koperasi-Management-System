"use client"

/**
 * @file src/components/anggota/edit-anggota-sheet.tsx
 * @description Komponen presentasional / interaktif: edit-anggota-sheet.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
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

  const [formValues, setFormValues] = useState({
    nik: anggota.nik,
    nama: anggota.nama,
    noHp: anggota.noHp ?? "",
    jenisKelamin: anggota.jenisKelamin ?? "",
    alamat: anggota.alamat,
    pekerjaan: anggota.pekerjaan ?? "",
    penghasilan: anggota.penghasilan?.toString() ?? "",
    tglMasuk: anggota.tglMasuk.slice(0, 10),
  })

  function handleChange(field: string, value: string) {
    setFormValues((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setConfirm(null)
    setLoading(true)
    setError(null)

    try {
      await updateAnggota({
        id: anggota.id,
        nik: formValues.nik,
        nama: formValues.nama,
        noHp: formValues.noHp || undefined,
        jenisKelamin: formValues.jenisKelamin || undefined,
        alamat: formValues.alamat,
        pekerjaan: formValues.pekerjaan || undefined,
        penghasilan: formValues.penghasilan ? Number(formValues.penghasilan) : null,
        foto,
        ktp,
        tglMasuk: formValues.tglMasuk,
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
            <form onSubmit={handleSubmitClick} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="nik">NIK *</Label>
                <Input id="nik" name="nik" value={formValues.nik} onChange={(e) => handleChange("nik", e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap *</Label>
                <Input id="nama" name="nama" value={formValues.nama} onChange={(e) => handleChange("nama", e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="noHp">No. HP</Label>
                <Input id="noHp" name="noHp" value={formValues.noHp} onChange={(e) => handleChange("noHp", e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                <Select name="jenisKelamin" value={formValues.jenisKelamin || undefined} onValueChange={(v) => handleChange("jenisKelamin", v)}>
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
                <Textarea id="alamat" name="alamat" value={formValues.alamat} onChange={(e) => handleChange("alamat", e.target.value)} required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pekerjaan">Pekerjaan</Label>
                  <Input id="pekerjaan" name="pekerjaan" value={formValues.pekerjaan} onChange={(e) => handleChange("pekerjaan", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="penghasilan">Penghasilan (Rp)</Label>
                  <Input
                    id="penghasilan"
                    name="penghasilan"
                    type="number"
                    value={formValues.penghasilan}
                    onChange={(e) => handleChange("penghasilan", e.target.value)}
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
                      <Image src={foto} alt="Foto preview" width={64} height={80} unoptimized className="h-20 w-16 rounded border object-cover" />
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
                      <Image src={ktp} alt="KTP preview" width={128} height={80} unoptimized className="h-20 w-32 rounded border object-cover" />
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
                    value={formValues.tglMasuk}
                    onChange={(e) => handleChange("tglMasuk", e.target.value)}
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
