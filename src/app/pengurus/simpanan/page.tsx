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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simpanan</h1>
        <p className="text-sm text-muted-foreground">Kelola simpanan anggota koperasi</p>
      </div>

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
