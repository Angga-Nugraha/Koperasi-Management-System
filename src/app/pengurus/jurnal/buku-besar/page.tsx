import { getAkunList, getBukuBesar } from "@/actions/jurnal"
import { BukuBesarClient } from "@/components/jurnal/buku-besar-client"

type Props = {
  searchParams: Promise<{ akunId?: string; dari?: string; sampai?: string }>
}

export default async function BukuBesarPage({ searchParams }: Props) {
  const { akunId, dari, sampai } = await searchParams
  const akunList = await getAkunList()

  const detail = akunId
    ? await getBukuBesar(akunId, dari ?? undefined, sampai ?? undefined)
    : []

  const akunTerpilih = akunId ? akunList.find((a) => a.id === akunId) : null

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
          <a href="/pengurus/jurnal" className="text-sm text-primary hover:underline">← Kembali</a>
        </div>
      </div>

      <BukuBesarClient
        akunList={akunList}
        akunId={akunId ?? ""}
        dari={dari ?? ""}
        sampai={sampai ?? ""}
        detail={detail}
        akunTerpilih={akunTerpilih}
      />
    </div>
  )
}
