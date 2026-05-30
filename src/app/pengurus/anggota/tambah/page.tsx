"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAnggota } from "@/actions/anggota"
import { ArrowLeft, X } from "lucide-react"
import Link from "next/link"

export default function TambahAnggotaPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [foto, setFoto] = useState<string | null>(null)
  const [ktp, setKtp] = useState<string | null>(null)
  const [fotoUploading, setFotoUploading] = useState(false)
  const [ktpUploading, setKtpUploading] = useState(false)

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await createAnggota({
        nik: formData.get("nik") as string,
        nama: formData.get("nama") as string,
        alamat: formData.get("alamat") as string,
        pekerjaan: (formData.get("pekerjaan") as string) || undefined,
        penghasilan: formData.get("penghasilan") ? Number(formData.get("penghasilan")) : null,
        foto,
        ktp,
        tglMasuk: formData.get("tglMasuk") as string,
      })
      router.push("/pengurus/anggota")
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
          <Link href="/pengurus/anggota">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tambah Anggota</h1>
          <p className="text-sm text-muted-foreground">Registrasi anggota baru koperasi</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Form Registrasi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nik">NIK *</Label>
              <Input id="nik" name="nik" placeholder="16 digit NIK" maxLength={16} required />
              <p className="text-xs text-muted-foreground">
                Nomor anggota akan digenerate otomatis (AGTYYMMDDXXXX)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input id="nama" name="nama" placeholder="Nama sesuai KTP" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alamat">Alamat *</Label>
              <Textarea id="alamat" name="alamat" placeholder="Alamat lengkap" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="pekerjaan">Pekerjaan</Label>
                <Input id="pekerjaan" name="pekerjaan" placeholder="Pekerjaan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penghasilan">Penghasilan (Rp)</Label>
                <Input id="penghasilan" name="penghasilan" type="number" placeholder="0" />
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
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || fotoUploading || ktpUploading}>
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/pengurus/anggota">Batal</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
