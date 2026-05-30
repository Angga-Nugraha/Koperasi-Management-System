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
  shuKotor: number
  cadangan: number
  shuDibagi: number
  jumlahAnggota: number
  perAnggota: number
}

export function SHUClient({ dari, sampai, pendapatan, beban, shuKotor, cadangan, shuDibagi, jumlahAnggota, perAnggota }: Props) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`/pengurus/jurnal/shu?${params.toString()}`)
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
                  <td className="px-4 py-2">{i.nama}</td>
                  <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="px-4 py-2">Total Pendapatan</td>
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
                  <td className="px-4 py-2">{i.nama}</td>
                  <td className="px-4 py-2 text-right">{fmt(i.saldo)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t font-medium">
                <td className="px-4 py-2">Total Beban</td>
                <td className="px-4 py-2 text-right">{fmt(beban.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Perhitungan SHU</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2">SHU Kotor (Pendapatan - Beban)</td>
              <td className="py-2 text-right font-medium">{fmt(shuKotor)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Cadangan (20%)</td>
              <td className="py-2 text-right text-amber-600">({fmt(cadangan)})</td>
            </tr>
            <tr className="border-b font-semibold">
              <td className="py-2">SHU Dibagi</td>
              <td className="py-2 text-right">{fmt(shuDibagi)}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Jumlah Anggota Aktif</td>
              <td className="py-2 text-right">{jumlahAnggota} orang</td>
            </tr>
            <tr className="text-lg font-bold">
              <td className="py-2">SHU per Anggota</td>
              <td className="py-2 text-right text-primary">{fmt(perAnggota)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
