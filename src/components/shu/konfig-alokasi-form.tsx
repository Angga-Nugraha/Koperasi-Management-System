"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getIndikatorSHUList, saveAllIndikatorSHU } from "@/actions/shu"
import { getAkunList } from "@/actions/konfigurasi"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"

type Indikator = Awaited<ReturnType<typeof getIndikatorSHUList>>[number]
type Akun = Awaited<ReturnType<typeof getAkunList>>[number]

export function KonfigAlokasiForm({
  data: initial,
  akunList,
}: {
  data: Indikator[]
  akunList: Akun[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initial.length > 0 ? initial : [{ id: "", kode: "", nama: "", persentase: 0, kelompok: "ANGGOTA", akunId: null, urutan: 1, isActive: true } as Indikator])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirm, setConfirm] = useState<{ onConfirm: () => void } | null>(null)

  const total = items.reduce((s, i) => s + i.persentase, 0)
  const akunSukarela = akunList.find((a) => a.kode === "2.1.3")

  function updateItem(index: number, field: keyof Indikator, value: unknown) {
    if (field === "kelompok") {
      setItems(items.map((item, i) =>
        i === index
          ? { ...item, kelompok: value as string, akunId: value === "ANGGOTA" ? (akunSukarela?.id ?? null) : null }
          : item,
      ))
    } else {
      setItems(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
    }
  }

  function addItem() {
    const maxUrutan = items.reduce((m, i) => Math.max(m, i.urutan), 0)
    setItems([...items, { id: "", kode: "", nama: "", persentase: 0, kelompok: "ANGGOTA", akunId: akunSukarela?.id ?? null, urutan: maxUrutan + 1, isActive: true } as Indikator])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setConfirm(null)
    setLoading(true)
    setError("")
    try {
      await saveAllIndikatorSHU(items.map((i) => ({
        kode: i.kode,
        nama: i.nama,
        persentase: i.persentase,
        kelompok: i.kelompok,
        akunId: i.akunId,
        urutan: i.urutan,
      })))
      router.push("/pengurus/shu")
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function handleSaveClick() {
    if (Math.abs(total - 100) > 0.01) {
      setError("Total persentase harus 100%")
      return
    }
    if (items.some((i) => !i.kode || !i.nama)) {
      setError("Kode dan Nama harus diisi untuk semua item")
      return
    }
    setConfirm({ onConfirm: handleSave })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pengurus/shu")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Konfigurasi Indikator SHU</h1>
          <p className="text-sm text-muted-foreground">Atur indikator pembagian SHU. Total persentase harus 100%.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Indikator SHU</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.kode || `indikator-${index}`} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap sm:gap-3 rounded-lg border p-4">
              <div className="space-y-1.5 w-full sm:flex-1">
                <Label className="text-xs">Kode</Label>
                <Input
                  placeholder="JM"
                  value={item.kode}
                  onChange={(e) => updateItem(index, "kode", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 w-full sm:flex-1">
                <Label className="text-xs">Nama</Label>
                <Input
                  placeholder="Jasa Modal"
                  value={item.nama}
                  onChange={(e) => updateItem(index, "nama", e.target.value)}
                />
              </div>
              <div className="space-y-1.5 w-full sm:w-24">
                <Label className="text-xs">%</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={item.persentase}
                  onChange={(e) => updateItem(index, "persentase", Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5 w-full sm:w-32">
                <Label className="text-xs">Kelompok</Label>
                <Select
                  value={item.kelompok}
                  onValueChange={(v) => updateItem(index, "kelompok", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANGGOTA">Anggota</SelectItem>
                    <SelectItem value="DANA">Dana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 w-full sm:flex-1">
                <Label className="text-xs">Akun Jurnal</Label>
                {item.kelompok === "ANGGOTA" && <span className="ml-1 text-xs text-muted-foreground">(otomatis ke 2.1.3)</span>}
                <Select
                  value={item.akunId ?? "__none__"}
                  onValueChange={(v) => updateItem(index, "akunId", v === "__none__" ? null : v)}
                  disabled={item.kelompok === "ANGGOTA"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">-- Tanpa akun --</SelectItem>
                    {akunList.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.kode} - {a.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length <= 1} aria-label="Hapus indikator">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className={`text-lg font-bold ${Math.abs(total - 100) < 0.01 ? "text-green-600" : "text-destructive"}`}>
              {total}%
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={handleSaveClick} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Simpan Konfigurasi SHU</AlertDialogTitle>
            <AlertDialogDescription>Simpan perubahan indikator SHU dan kembali ke daftar?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirm?.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
