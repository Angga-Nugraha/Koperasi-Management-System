/**
 * @file src/app/pengurus/pinjaman/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getPinjamanList } from "@/actions/pinjaman"
import { PinjamanTable } from "@/components/pinjaman/pinjaman-table"

type Props = {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string }>
}

export default async function PinjamanPage({ searchParams }: Props) {
  const { search, status, page, pageSize: ps } = await searchParams
  const pageSize = Number(ps) || 20

  const result = await getPinjamanList({
    search,
    status,
    page: page ? Number(page) : 1,
    pageSize,
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Pinjaman" description="Kelola pinjaman anggota koperasi" />
      <PinjamanTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={pageSize}
        search={search}
        status={status}
      />
    </div>
  )
}
