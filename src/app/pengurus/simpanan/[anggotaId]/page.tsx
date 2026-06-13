/**
 * @file src/app/pengurus/simpanan/[anggotaId]/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getSimpananAnggota, getMutasiAnggota } from "@/actions/simpanan"
import { getAnggotaById } from "@/actions/anggota"
import { notFound } from "next/navigation"
import { MutasiTable } from "@/components/simpanan/mutasi-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import { formatRupiah } from "@/lib/format"

type Props = {
  params: Promise<{ anggotaId: string }>
  searchParams: Promise<{ jenis?: string; page?: string; pageSize?: string }>
}

export default async function SimpananAnggotaPage({ params, searchParams }: Props) {
  const { anggotaId } = await params
  const sp = await searchParams
  const jenisCode = sp.jenis ?? "SEMUA"
  const page = Number(sp.page) || 1
  const pageSize = Number(sp.pageSize) || 20

  const anggota = await getAnggotaById(anggotaId)
  if (!anggota) notFound()

  const simpanan = await getSimpananAnggota(anggotaId)
  const mutasi = await getMutasiAnggota(anggotaId, {
    jenisSimpananId:
      jenisCode !== "SEMUA"
        ? (await prisma.jenisSimpanan.findUnique({ where: { kode: jenisCode } }))?.id
        : undefined,
    page,
    pageSize,
  })

  const totalSaldo = simpanan.reduce((s, x) => s + x.saldo, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pengurus/simpanan">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <PageHeader title={anggota.nama} description={anggota.noAnggota} />
          <Badge variant={anggota.status === "AKTIF" ? "default" : "secondary"}>
            {anggota.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {simpanan.map((s) => (
          <Card key={s.jenisKode}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{s.jenisNama}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatRupiah(s.saldo)}</p>
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatRupiah(totalSaldo)}</p>
          </CardContent>
        </Card>
      </div>

      <MutasiTable
        data={mutasi.data}
        total={mutasi.total}
        page={mutasi.page}
        totalPages={mutasi.totalPages}
        pageSize={pageSize}
        anggotaId={anggotaId}
      />

      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link href={`/pengurus/simpanan/setor?anggotaId=${anggotaId}`}>Setor</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/pengurus/simpanan/tarik?anggotaId=${anggotaId}`}>Tarik</Link>
        </Button>
      </div>
    </div>
  )
}
