/**
 * @file src/app/pengurus/simpanan/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getSimpananList } from "@/actions/simpanan"
import { SimpananTable } from "@/components/simpanan/simpanan-table"
import { prisma } from "@/lib/prisma"

type Props = {
  searchParams: Promise<{ search?: string; jenis?: string; page?: string; pageSize?: string }>
}

export default async function SimpananListPage({ searchParams }: Props) {
  const params = await searchParams
  const search = params.search ?? ""
  const jenisCode = params.jenis ?? ""
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20

  let jenisSimpananId: string | undefined
  if (jenisCode && jenisCode !== "SEMUA") {
    const jenis = await prisma.jenisSimpanan.findUnique({ where: { kode: jenisCode } })
    if (jenis) jenisSimpananId = jenis.id
  }

  const result = await getSimpananList({ search, jenisSimpananId, page, pageSize })

  return (
    <div className="space-y-6">
      <PageHeader title="Simpanan" description="Kelola simpanan anggota koperasi" />

      <SimpananTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={pageSize}
        search={search}
      />
    </div>
  )
}
