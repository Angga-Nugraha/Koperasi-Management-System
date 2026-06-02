import { getArusKas } from "@/actions/jurnal"
import { ArusKasClient } from "@/components/jurnal/arus-kas-client"

type Props = {
  searchParams: Promise<{ dari?: string; sampai?: string; page?: string; pageSize?: string }>
}

export default async function ArusKasPage({ searchParams }: Props) {
  const { dari, sampai, page, pageSize: ps } = await searchParams
  const pageSize = Number(ps) || 20
  const result = await getArusKas(dari ?? undefined, sampai ?? undefined, Number(page) || 1, pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Arus Kas</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/laporan?type=arus-kas${dari ? `&dari=${dari}` : ""}${sampai ? `&sampai=${sampai}` : ""}`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
        </div>
      </div>
      <ArusKasClient dari={dari ?? ""} sampai={sampai ?? ""} items={result.items} totalMasuk={result.totalMasuk} totalKeluar={result.totalKeluar} saldoAkhir={result.saldoAkhir} page={result.page} totalPages={result.totalPages} pageSize={pageSize} />
    </div>
  )
}
