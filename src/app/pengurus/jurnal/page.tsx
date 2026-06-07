/**
 * @file src/app/pengurus/jurnal/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { getJurnalList } from "@/actions/jurnal"
import { JurnalTable } from "@/components/jurnal/jurnal-table"

type Props = {
  searchParams: Promise<{ search?: string; page?: string; pageSize?: string }>
}

export default async function JurnalPage({ searchParams }: Props) {
  const { search, page, pageSize: ps } = await searchParams
  const pageSize = Number(ps) || 20

  const result = await getJurnalList({
    search,
    page: page ? Number(page) : 1,
    pageSize,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Umum</h1>
          <p className="text-sm text-muted-foreground">Daftar seluruh jurnal dan catatan transaksi</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <a
            href="/api/export/jurnal-excel"
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
        </div>
        <a
          href="/pengurus/jurnal/manual"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Jurnal Manual
        </a>
      </div>

      <JurnalTable
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
