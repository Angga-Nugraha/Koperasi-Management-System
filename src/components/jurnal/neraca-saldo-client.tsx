"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type NeracaItem = {
  akunId: string
  kode: string
  nama: string
  tipe: string
  debit: number
  kredit: number
  saldo: number
  saldoNormal: string
}

type Props = {
  sampai: string
  data: NeracaItem[]
  totalDebit: number
  totalKredit: number
}

export function NeracaSaldoClient({ sampai, data, totalDebit, totalKredit }: Props) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/neraca-saldo?${params.toString()}`)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label>Sampai Tanggal</Label>
          <Input type="date" name="sampai" defaultValue={sampai} />
        </div>
        <Button type="submit">Tampilkan</Button>
      </form>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Kode</th>
              <th className="px-4 py-2 text-left font-medium">Nama Akun</th>
              <th className="px-4 py-2 text-right font-medium">Debit</th>
              <th className="px-4 py-2 text-right font-medium">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.akunId} className="border-b">
                <td className="px-4 py-2 font-mono text-xs">{item.kode}</td>
                <td className="px-4 py-2">{item.nama}</td>
                <td className="px-4 py-2 text-right">{item.debit > 0 ? fmt(item.debit) : "-"}</td>
                <td className="px-4 py-2 text-right">{item.kredit > 0 ? fmt(item.kredit) : "-"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-medium border-t">
              <td colSpan={2} className="px-4 py-2 text-right">Total</td>
              <td className="px-4 py-2 text-right">{fmt(totalDebit)}</td>
              <td className="px-4 py-2 text-right">{fmt(totalKredit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
