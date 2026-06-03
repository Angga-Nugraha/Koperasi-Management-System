import { getAkunList, getBukuBesar } from "@/actions/jurnal"
import { BukuBesarClient } from "@/components/jurnal/buku-besar-client"

type Props = {
  searchParams: Promise<{ akunId?: string; dari?: string; sampai?: string; page?: string; pageSize?: string }>
}

export default async function BukuBesarPage({ searchParams }: Props) {
  const { akunId, dari, sampai, page, pageSize: ps } = await searchParams
  const pageSize = Number(ps) || 20
  const akunList = await getAkunList()

  const result = akunId
    ? await getBukuBesar(akunId, dari ?? undefined, sampai ?? undefined, Number(page) || 1, pageSize)
    : { data: [], total: 0, page: 1, totalPages: 0, saldoAwal: 0 }

  const akunTerpilih = akunId ? akunList.find((a) => a.id === akunId) ?? null : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Buku Besar</h1>
        <div className="flex items-center gap-2">
          {akunId && (
            <a
              href={`/api/export/laporan?type=buku-besar&akunId=${akunId}${dari ? `&dari=${dari}` : ""}${sampai ? `&sampai=${sampai}` : ""}`}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
            >
              Export Excel
            </a>
            )}
        </div>
      </div>

      <BukuBesarClient
        akunList={akunList}
        akunId={akunId ?? ""}
        dari={dari ?? ""}
        sampai={sampai ?? ""}
        detail={result.data}
        akunTerpilih={akunTerpilih}
        saldoAwal={result.saldoAwal}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={pageSize}
      />
    </div>
  )
}
