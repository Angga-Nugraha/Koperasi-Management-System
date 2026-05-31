"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createJurnalManual } from "@/actions/jurnal"

type AkunItem = { id: string; kode: string; nama: string; tipe: string; saldoNormal: string }

type Entry = {
  akunId: string
  debit: string
  kredit: string
}

type Props = {
  akunList: AkunItem[]
}

export function JurnalManualForm({ akunList }: Props) {
  const router = useRouter()
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10))
  const [keterangan, setKeterangan] = useState("")
  const [entries, setEntries] = useState<Entry[]>([
    { akunId: "", debit: "0", kredit: "0" },
    { akunId: "", debit: "0", kredit: "0" },
  ])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function addEntry() {
    setEntries([...entries, { akunId: "", debit: "0", kredit: "0" }])
  }

  function removeEntry(i: number) {
    if (entries.length <= 2) return
    setEntries(entries.filter((_, idx) => idx !== i))
  }

  function updateEntry(i: number, field: keyof Entry, value: string) {
    const next = [...entries]
    next[i] = { ...next[i], [field]: value }
    setEntries(next)
  }

  const totalDebit = entries.reduce((s, e) => s + (Number(e.debit) || 0), 0)
  const totalKredit = entries.reduce((s, e) => s + (Number(e.kredit) || 0), 0)
  const balance = Math.abs(totalDebit - totalKredit) < 0.01

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!balance) {
      setError("Total debit harus sama dengan total kredit")
      return
    }

    const nonZero = entries.filter(
      (e) => e.akunId && (Number(e.debit) > 0 || Number(e.kredit) > 0)
    )
    if (nonZero.length < 2) {
      setError("Minimal 2 entry dengan akun dipilih")
      return
    }

    setLoading(true)
    try {
      await createJurnalManual({
        tanggal,
        keterangan,
        entries: entries
          .filter((e) => e.akunId && (Number(e.debit) > 0 || Number(e.kredit) > 0))
          .map((e) => ({
            akunId: e.akunId,
            debit: Number(e.debit),
            kredit: Number(e.kredit),
          })),
      })
      router.push("/pengurus/jurnal")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan jurnal")
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Deskripsi jurnal"
              required
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Akun</th>
              <th className="px-4 py-2 text-right font-medium">Debit</th>
              <th className="px-4 py-2 text-right font-medium">Kredit</th>
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-2">
                  <Select
                    value={entry.akunId}
                    onValueChange={(v) => updateEntry(i, "akunId", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                    <SelectContent>
                      {akunList.map((akun) => (
                        <SelectItem key={akun.id} value={akun.id}>
                          {akun.kode} - {akun.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entry.debit}
                    onChange={(e) => updateEntry(i, "debit", e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entry.kredit}
                    onChange={(e) => updateEntry(i, "kredit", e.target.value)}
                  />
                </td>
                <td className="px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={entries.length <= 2}
                    onClick={() => removeEntry(i)}
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-medium border-t">
              <td className="px-4 py-2">Total</td>
              <td className="px-4 py-2 text-right">{fmt(totalDebit)}</td>
              <td className="px-4 py-2 text-right">{fmt(totalKredit)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={4} className="px-4 py-2">
                <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                  + Tambah Baris
                </Button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {!balance && entries.length >= 2 && (
        <p className="text-sm text-amber-600">
          Total debit ({fmt(totalDebit)}) ≠ total kredit ({fmt(totalKredit)})
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Jurnal"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/pengurus/jurnal")}
        >
          Batal
        </Button>
      </div>
    </form>
  )
}
