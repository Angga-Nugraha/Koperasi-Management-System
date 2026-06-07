"use client"

/**
 * @file src/components/shu/shu-anggota.tsx
 * @description Komponen presentasional / interaktif: shu-anggota.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getSHUAnggota } from "@/actions/shu"
import { CheckCircle2, Clock } from "lucide-react"

type SHUAnggota = Awaited<ReturnType<typeof getSHUAnggota>>

export function SHUAnggotaCard({ data }: { data: SHUAnggota }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12">
          <p className="text-sm text-muted-foreground">Belum ada SHU</p>
          <p className="text-xs text-muted-foreground">SHU tahun ini belum diproses oleh pengurus</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SHU Saya</h1>
        <p className="text-sm text-muted-foreground">Rincian Sisa Hasil Usaha yang diterima</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat SHU</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tahun</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Jasa Modal</TableHead>
                <TableHead className="text-right">Jasa Usaha</TableHead>
                <TableHead className="text-right">Total SHU</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((s) => (
                <TableRow key={s.tahun}>
                  <TableCell className="font-medium">{s.tahun}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "FINAL" ? "default" : "secondary"}>
                      {s.status === "FINAL" ? (
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> FINAL</span>
                      ) : (
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> DRAFT</span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">Rp {s.jasaModal.toLocaleString("id-ID")}</TableCell>
                  <TableCell className="text-right">Rp {s.jasaUsaha.toLocaleString("id-ID")}</TableCell>
                  <TableCell className={`text-right font-bold ${s.total >= 0 ? "text-green-600" : "text-red-600"}`}>Rp {s.total.toLocaleString("id-ID")}</TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
