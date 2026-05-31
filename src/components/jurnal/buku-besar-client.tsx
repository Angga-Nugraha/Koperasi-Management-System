"use client"

import { useRouter, useSearchParams } from "next/navigation"
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
import { formatTanggal } from "@/lib/format"

type AkunItem = { id: string; kode: string; nama: string; tipe: string; saldoNormal: string }

type DetailItem = {
  noJurnal: string
  tanggal: string
  keterangan: string
  debit: number
  kredit: number
  saldoNormal: string
}

type Props = {
  akunList: AkunItem[]
  akunId: string
  dari: string
  sampai: string
  detail: DetailItem[]
  akunTerpilih: AkunItem | null
}

export function BukuBesarClient({ akunList, akunId, dari, sampai, detail, akunTerpilih }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const params = new URLSearchParams()
    const fd = new FormData(form)
    const aId = fd.get("akunId") as string
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    if (aId) params.set("akunId", aId)
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/buku-besar?${params.toString()}`)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  let saldo = 0
  const rows = detail.map((d) => {
    if (d.saldoNormal === "DEBIT") {
      saldo += d.debit - d.kredit
    } else {
      saldo += d.kredit - d.debit
    }
    return { ...d, saldo: Math.round(saldo * 100) / 100 }
  })

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label>Akun</Label>
          <Select name="akunId" defaultValue={akunId}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Pilih akun" />
            </SelectTrigger>
            <SelectContent>
              {akunList.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.kode} - {a.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Dari</Label>
          <Input type="date" name="dari" defaultValue={dari} />
        </div>
        <div className="space-y-2">
          <Label>Sampai</Label>
          <Input type="date" name="sampai" defaultValue={sampai} />
        </div>
        <Button type="submit">Tampilkan</Button>
      </form>

      {akunTerpilih && (
        <>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-lg font-semibold">
              {akunTerpilih.kode} - {akunTerpilih.nama}
            </p>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Tanggal</th>
                  <th className="px-4 py-2 text-left font-medium">No Jurnal</th>
                  <th className="px-4 py-2 text-left font-medium">Keterangan</th>
                  <th className="px-4 py-2 text-right font-medium">Debit</th>
                  <th className="px-4 py-2 text-right font-medium">Kredit</th>
                  <th className="px-4 py-2 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Tidak ada transaksi untuk periode ini
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-2">{formatTanggal(r.tanggal)}</td>
                    <td className="px-4 py-2 font-mono text-xs">{r.noJurnal}</td>
                    <td className="px-4 py-2">{r.keterangan}</td>
                    <td className="px-4 py-2 text-right">{r.debit > 0 ? fmt(r.debit) : "-"}</td>
                    <td className="px-4 py-2 text-right">{r.kredit > 0 ? fmt(r.kredit) : "-"}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(r.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
