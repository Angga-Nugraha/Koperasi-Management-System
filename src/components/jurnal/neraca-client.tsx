"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  sampai: string
  aset: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  liabilitas: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  ekuitas: { items: { kode: string; nama: string; saldo: number }[]; total: number }
}

export function NeracaClient({ sampai, aset, liabilitas, ekuitas }: Props) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/neraca?${params.toString()}`)
  }

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
        <div className="space-y-2">
          <Label>Sampai Tanggal</Label>
          <Input type="date" name="sampai" defaultValue={sampai} />
        </div>
        <Button type="submit">Tampilkan</Button>
      </form>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold">ASET</div>
          <table className="w-full text-sm">
            <tbody>
              {aset.items.map((i) => (
                <tr key={i.kode} className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">{i.kode}</td>
                  <td className="px-4 py-2">{i.nama}</td>
                  <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td colSpan={2} className="px-4 py-2 text-right">Total Aset</td>
                <td className="px-4 py-2 text-right">{fmt(aset.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="space-y-6">
          <div className="rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 font-semibold">KEWAJIBAN</div>
            <table className="w-full text-sm">
              <tbody>
                {liabilitas.items.map((i) => (
                  <tr key={i.kode} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{i.kode}</td>
                    <td className="px-4 py-2">{i.nama}</td>
                    <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td colSpan={2} className="px-4 py-2 text-right">Total Kewajiban</td>
                  <td className="px-4 py-2 text-right">{fmt(liabilitas.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 font-semibold">EKUITAS</div>
            <table className="w-full text-sm">
              <tbody>
                {ekuitas.items.map((i) => (
                  <tr key={i.kode} className="border-b">
                    <td className="px-4 py-2 font-mono text-xs">{i.kode}</td>
                    <td className="px-4 py-2">{i.nama}</td>
                    <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t font-medium">
                  <td colSpan={2} className="px-4 py-2 text-right">Total Ekuitas</td>
                  <td className="px-4 py-2 text-right">{fmt(ekuitas.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="rounded-md border bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Kewajiban + Ekuitas</p>
            <p className="text-xl font-bold">{fmt(liabilitas.total + ekuitas.total)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
