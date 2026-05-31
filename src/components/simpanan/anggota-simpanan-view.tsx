"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { formatTanggal } from "@/lib/format"
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
  mutasi: { data: Mutasi[]; total: number; page?: number; totalPages?: number }
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const totalSaldo = simpanan.reduce((s, x) => s + x.saldo, 0)

  function goPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    router.push(`/anggota/simpanan?${params.toString()}`)
  }

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
                      {formatTanggal(t.createdAt)}
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

          {mutasi.totalPages && mutasi.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>Halaman {mutasi.page} dari {mutasi.totalPages}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(mutasi.page ?? 1) <= 1}
                  onClick={() => goPage((mutasi.page ?? 1) - 1)}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(mutasi.page ?? 1) >= (mutasi.totalPages ?? 1)}
                  onClick={() => goPage((mutasi.page ?? 1) + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
