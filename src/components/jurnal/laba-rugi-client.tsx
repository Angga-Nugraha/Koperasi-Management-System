"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  dari: string
  sampai: string
  pendapatan: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  beban: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  labaBersih: number
}

export function LabaRugiClient({ dari, sampai, pendapatan, beban, labaBersih }: Props) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/laba-rugi?${params.toString()}`)
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold">PENDAPATAN</div>
          <table className="w-full text-sm">
            <tbody>
              {pendapatan.items.map((i) => (
                <tr key={i.kode} className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">{i.kode}</td>
                  <td className="px-4 py-2">{i.nama}</td>
                  <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td colSpan={2} className="px-4 py-2 text-right">Total Pendapatan</td>
                <td className="px-4 py-2 text-right">{fmt(pendapatan.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold">BEBAN</div>
          <table className="w-full text-sm">
            <tbody>
              {beban.items.map((i) => (
                <tr key={i.kode} className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">{i.kode}</td>
                  <td className="px-4 py-2">{i.nama}</td>
                  <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td colSpan={2} className="px-4 py-2 text-right">Total Beban</td>
                <td className="px-4 py-2 text-right">{fmt(beban.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-primary/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">Laba / Rugi Bersih</p>
        <p className={`text-2xl font-bold ${labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
          {fmt(labaBersih)}
        </p>
      </div>
    </div>
  )
}
