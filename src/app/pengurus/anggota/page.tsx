/**
 * @file src/app/pengurus/anggota/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { getAnggotaList } from "@/actions/anggota"
import { AnggotaTable } from "@/components/anggota/anggota-table"

type Props = {
  searchParams: Promise<{ search?: string; status?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string }>
}

export default async function AnggotaListPage({ searchParams }: Props) {
  const params = await searchParams
  const search = params.search ?? ""
  const status = params.status ?? "SEMUA"
  const sortBy = params.sortBy ?? ""
  const sortOrder = params.sortOrder ?? ""
  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 20

  const result = await getAnggotaList({ search, status, sortBy, sortOrder, page, pageSize })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Anggota</h1>
        <p className="text-sm text-muted-foreground">Kelola data anggota koperasi</p>
      </div>

      <AnggotaTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={pageSize}
        search={search}
        status={status}
        sortBy={sortBy}
        sortOrder={sortOrder}
      />
    </div>
  )
}
