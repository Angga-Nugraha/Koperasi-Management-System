import { formatTanggal } from "@/lib/format"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TransaksiItem = {
  id: string
  noJurnal: string
  tanggal: string
  keterangan: string | null
  totalDebit: number
  totalKredit: number
  detail: { akunKode: string; akunNama: string; debit: number; kredit: number }[]
}

type Props = {
  data: TransaksiItem[]
}

export function TransaksiTerbaru({ data }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tanggal</TableHead>
          <TableHead>No. Jurnal</TableHead>
          <TableHead>Keterangan</TableHead>
          <TableHead className="text-right">Debit</TableHead>
          <TableHead className="text-right">Kredit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              Belum ada transaksi
            </TableCell>
          </TableRow>
        ) : (
          data.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="text-sm whitespace-nowrap">
                {formatTanggal(t.tanggal)}
              </TableCell>
              <TableCell className="font-mono text-xs">{t.noJurnal}</TableCell>
              <TableCell className="max-w-[200px] truncate" title={t.keterangan ?? ""}>
                {t.keterangan ?? "-"}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                Rp {t.totalDebit.toLocaleString("id-ID")}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                Rp {t.totalKredit.toLocaleString("id-ID")}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
