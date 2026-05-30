import { getAnggotaList } from "@/actions/anggota"
import { AnggotaTable } from "@/components/anggota/anggota-table"

type Props = {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>
}

export default async function AnggotaListPage({ searchParams }: Props) {
  const params = await searchParams
  const search = params.search ?? ""
  const status = params.status ?? "SEMUA"
  const page = Number(params.page) || 1

  const result = await getAnggotaList({ search, status, page })

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
        search={search}
        status={status}
      />
    </div>
  )
}
