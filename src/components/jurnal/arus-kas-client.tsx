"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatTanggal } from "@/lib/format"
import { Label } from "@/components/ui/label"

type ArusKasItem = {
  tanggal: string
  noJurnal: string
  keterangan: string
  masuk: number
  keluar: number
}

type Props = {
  dari: string
  sampai: string
  items: ArusKasItem[]
  totalMasuk: number
  totalKeluar: number
  saldoAkhir: number
}

export function ArusKasClient({ dari, sampai, items, totalMasuk, totalKeluar, saldoAkhir }: Props) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/arus-kas?${params.toString()}`)
  }

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-green-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Masuk</p>
          <p className="text-xl font-bold text-green-700">{fmt(totalMasuk)}</p>
        </div>
        <div className="rounded-lg border bg-red-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Total Keluar</p>
          <p className="text-xl font-bold text-red-700">{fmt(totalKeluar)}</p>
        </div>
        <div className="rounded-lg border bg-blue-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">Saldo Akhir</p>
          <p className={`text-xl font-bold ${saldoAkhir >= 0 ? "text-blue-700" : "text-red-700"}`}>
            {fmt(saldoAkhir)}
          </p>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Tanggal</th>
              <th className="px-4 py-2 text-left font-medium">Jurnal</th>
              <th className="px-4 py-2 text-left font-medium">Keterangan</th>
              <th className="px-4 py-2 text-right font-medium">Masuk</th>
              <th className="px-4 py-2 text-right font-medium">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Tidak ada transaksi kas
                </td>
              </tr>
            )}
            {items.map((i, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">{formatTanggal(i.tanggal)}</td>
                <td className="px-4 py-2 font-mono text-xs">{i.noJurnal}</td>
                <td className="px-4 py-2">{i.keterangan}</td>
                <td className="px-4 py-2 text-right text-green-700">
                  {i.masuk > 0 ? fmt(i.masuk) : "-"}
                </td>
                <td className="px-4 py-2 text-right text-red-700">
                  {i.keluar > 0 ? fmt(i.keluar) : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
