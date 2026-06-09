"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { tambahJabatan } from "@/actions/kepengurusan"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TambahJabatanDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [jabatan, setJabatan] = useState("")
  const [tipe, setTipe] = useState("PENGURUS")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!jabatan.trim()) {
      setError("Nama jabatan wajib diisi")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await tambahJabatan({ jabatan: jabatan.trim(), tipe: tipe as "PENGURUS" | "PENGAWAS" })
      setJabatan("")
      setTipe("PENGURUS")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah jabatan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Jabatan Baru</DialogTitle>
          <DialogDescription>Tambah posisi baru untuk pengurus atau pengawas</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="jabatan">Nama Jabatan *</Label>
            <Input
              id="jabatan"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Contoh: Wakil Ketua Bidang Usaha"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipe">Tipe *</Label>
            <Select value={tipe} onValueChange={setTipe}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENGURUS">Pengurus</SelectItem>
                <SelectItem value="PENGAWAS">Pengawas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Tambah"}
            </Button>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
