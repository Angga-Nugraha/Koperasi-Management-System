"use client"

/**
 * @file src/components/jurnal/neraca-client.tsx
 * @description Komponen presentasional / interaktif: neraca-client.
 */

import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

type Props = {
  sampai: string
  aset: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  liabilitas: { items: { kode: string; nama: string; saldo: number }[]; total: number }
  ekuitas: { items: { kode: string; nama: string; saldo: number }[]; total: number }
}

export function NeracaClient({ sampai, aset, liabilitas, ekuitas }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(e.target as HTMLFormElement)
    const s = fd.get("sampai") as string
    const params = new URLSearchParams()
    if (s) params.set("sampai", s)
    router.push(`${pathname}?${params.toString()}`)
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="space-y-2 w-full sm:w-auto">
              <Label>Sampai Tanggal</Label>
              <Input type="date" name="sampai" defaultValue={sampai} className="w-full sm:w-auto" />
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              Tampilkan
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-x-auto rounded-md border">
          <div className="border-b bg-muted/50 px-4 py-2 font-semibold">ASET</div>
          <Table>
            <TableBody>
              {aset.items.map((i) => (
                <TableRow key={i.kode}>
                  <TableCell className="font-mono text-xs">{i.kode}</TableCell>
                  <TableCell>{i.nama}</TableCell>
                  <TableCell className="text-right">{fmt(i.saldo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="border-t px-4 py-2 text-right text-sm font-medium">
            Total Aset: <span className="font-mono">{fmt(aset.total)}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-x-auto rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 font-semibold">KEWAJIBAN</div>
            <Table>
              <TableBody>
                {liabilitas.items.map((i) => (
                  <TableRow key={i.kode}>
                    <TableCell className="font-mono text-xs">{i.kode}</TableCell>
                    <TableCell>{i.nama}</TableCell>
                    <TableCell className="text-right">{fmt(i.saldo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-2 text-right text-sm font-medium">
              Total Kewajiban: <span className="font-mono">{fmt(liabilitas.total)}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <div className="border-b bg-muted/50 px-4 py-2 font-semibold">EKUITAS</div>
            <Table>
              <TableBody>
                {ekuitas.items.map((i) => (
                  <TableRow key={i.kode}>
                    <TableCell className="font-mono text-xs">{i.kode}</TableCell>
                    <TableCell>{i.nama}</TableCell>
                    <TableCell className="text-right">{fmt(i.saldo)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-4 py-2 text-right text-sm font-medium">
              Total Ekuitas: <span className="font-mono">{fmt(ekuitas.total)}</span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">Kewajiban + Ekuitas</p>
            <p className="text-xl font-bold">{fmt(liabilitas.total + ekuitas.total)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
