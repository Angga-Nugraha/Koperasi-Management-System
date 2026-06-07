"use client"

/**
 * @file src/components/jurnal/laba-rugi-client.tsx
 * @description Komponen presentasional / interaktif: laba-rugi-client.
 */

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

type Props = {
  dari: string
  sampai: string
  pendapatan: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  beban: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  labaBersih: number
}

export function LabaRugiClient({ dari, sampai, pendapatan, beban, labaBersih }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const d = fd.get("dari") as string
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (d) params.set("dari", d)
    if (s) params.set("sampai", s)
    router.push(`${pathname}?${params.toString()}`)
  }

  const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-2 w-full sm:w-auto">
          <Label>Dari</Label>
          <Input type="date" name="dari" defaultValue={dari} className="w-full sm:w-auto" />
        </div>
        <div className="space-y-2 w-full sm:w-auto">
          <Label>Sampai</Label>
          <Input type="date" name="sampai" defaultValue={sampai} className="w-full sm:w-auto" />
        </div>
        <Button type="submit" className="w-full sm:w-auto">Tampilkan</Button>
      </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-x-auto rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold">PENDAPATAN</div>
          <Table>
            <TableBody>
              {pendapatan.items.map((i) => (
                <TableRow key={i.kode}>
                  <TableCell className="font-mono text-xs">{i.kode}</TableCell>
                  <TableCell>{i.nama}</TableCell>
                  <TableCell className="text-right">{fmt(i.saldo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-2 text-right text-sm font-medium">
            Total Pendapatan: <span className="font-mono">{fmt(pendapatan.total)}</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold">BEBAN</div>
          <Table>
            <TableBody>
              {beban.items.map((i) => (
                <TableRow key={i.kode}>
                  <TableCell className="font-mono text-xs">{i.kode}</TableCell>
                  <TableCell>{i.nama}</TableCell>
                  <TableCell className="text-right">{fmt(i.saldo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-2 text-right text-sm font-medium">
            Total Beban: <span className="font-mono">{fmt(beban.total)}</span>
          </div>
        </div>
      </div>

      <Card className="bg-primary/5">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">Laba / Rugi Bersih</p>
          <p className={`text-2xl font-bold ${labaBersih >= 0 ? "text-green-600" : "text-red-600"}`}>
            {fmt(labaBersih)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
