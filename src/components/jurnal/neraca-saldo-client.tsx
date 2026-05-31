"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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
      <Card>
        <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Sampai Tanggal</Label>
          <Input type="date" name="sampai" defaultValue={sampai} />
        </div>
        <Button type="submit">Tampilkan</Button>
      </form>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama Akun</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.akunId}>
                <TableCell className="font-mono text-xs">{item.kode}</TableCell>
                <TableCell>{item.nama}</TableCell>
                <TableCell className="text-right">{item.debit > 0 ? fmt(item.debit) : "-"}</TableCell>
                <TableCell className="text-right">{item.kredit > 0 ? fmt(item.kredit) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-8 rounded-md border bg-muted/50 px-4 py-2 text-sm font-medium">
        <span>Total Debit: <span className="font-mono">{fmt(totalDebit)}</span></span>
        <span>Total Kredit: <span className="font-mono">{fmt(totalKredit)}</span></span>
      </div>
    </div>
  )
}
