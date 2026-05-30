"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Simpanan = {
  id: string
  jenisKode: string
  jenisNama: string
  saldo: number
}

type Mutasi = {
  id: string
  jenisKode: string
  jenisNama: string
  tipe: string
  nominal: number
  saldoSetelah: number
  keterangan: string | null
  createdAt: string
}

type Props = {
  simpanan: Simpanan[]
  mutasi: { data: Mutasi[]; total: number }
}

const TIPE_VARIANTS: Record<string, "default" | "destructive"> = {
  SETORAN: "default",
  PENARIKAN: "destructive",
}

const TIPE_LABEL: Record<string, string> = {
  SETORAN: "Setoran",
  PENARIKAN: "Penarikan",
}

export function AnggotaSimpananView({ simpanan, mutasi }: Props) {
  const totalSaldo = simpanan.reduce((s, x) => s + x.saldo, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simpanan Saya</h1>
        <p className="text-sm text-muted-foreground">Ringkasan simpanan Anda</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {simpanan.map((s) => (
          <Card key={s.jenisKode}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {s.jenisNama}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Rp {s.saldo.toLocaleString("id-ID")}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {totalSaldo.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mutasi Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mutasi.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Belum ada transaksi
                  </TableCell>
                </TableRow>
              ) : (
                mutasi.data.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">
                      {new Date(t.createdAt).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell>{t.jenisNama}</TableCell>
                    <TableCell>
                      <Badge variant={TIPE_VARIANTS[t.tipe] ?? "secondary"}>
                        {TIPE_LABEL[t.tipe] ?? t.tipe}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      Rp {t.nominal.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      Rp {t.saldoSetelah.toLocaleString("id-ID")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
