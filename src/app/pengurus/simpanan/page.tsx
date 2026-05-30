import { getSimpananList } from "@/actions/simpanan"
import { SimpananTable } from "@/components/simpanan/simpanan-table"

type Props = {
  searchParams: Promise<{ search?: string; jenis?: string; page?: string }>
}

export default async function SimpananListPage({ searchParams }: Props) {
  const params = await searchParams
  const search = params.search ?? ""
  const jenis = params.jenis ?? "SEMUA"
  const page = Number(params.page) || 1

  const result = await getSimpananList({ search, jenis, page })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simpanan</h1>
        <p className="text-sm text-muted-foreground">Kelola simpanan anggota koperasi</p>
      </div>

      <SimpananTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        search={search}
        jenis={jenis}
      />
    </div>
  )
}
