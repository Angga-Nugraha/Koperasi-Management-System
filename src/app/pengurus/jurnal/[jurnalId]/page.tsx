import { getJurnalById } from "@/actions/jurnal"
import { formatTanggal } from "@/lib/format"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Props = {
  params: Promise<{ jurnalId: string }>
}

export default async function JurnalDetailPage({ params }: Props) {
  const { jurnalId } = await params
  const jurnal = await getJurnalById(jurnalId)
  if (!jurnal) notFound()

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Detail Jurnal</h1>

      <Card>
        <CardContent className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">No Jurnal</span>
            <p className="font-mono font-medium">{jurnal.noJurnal}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Tanggal</span>
            <p className="font-medium">
              {formatTanggal(jurnal.tanggal)}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-sm text-muted-foreground">Keterangan</span>
            <p className="font-medium">{jurnal.keterangan}</p>
          </div>
        </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Kode Akun</TableHead>
              <TableHead>Nama Akun</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jurnal.detail.map((d, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{d.akunKode}</TableCell>
                <TableCell>{d.akunNama}</TableCell>
                <TableCell className="text-right">{d.debit > 0 ? fmt(d.debit) : "-"}</TableCell>
                <TableCell className="text-right">{d.kredit > 0 ? fmt(d.kredit) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-8 rounded-md border bg-muted/50 px-4 py-2 text-sm font-medium">
        <span>Total Debit: <span className="font-mono">{fmt(jurnal.totalDebit)}</span></span>
        <span>Total Kredit: <span className="font-mono">{fmt(jurnal.totalKredit)}</span></span>
      </div>
    </div>
  )
}
