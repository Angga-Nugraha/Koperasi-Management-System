import { getLabaRugi } from "@/actions/jurnal"
import { LabaRugiClient } from "@/components/jurnal/laba-rugi-client"

type Props = {
  searchParams: Promise<{ dari?: string; sampai?: string }>
}

export default async function LabaRugiPage({ searchParams }: Props) {
  const { dari, sampai } = await searchParams
  const result = await getLabaRugi(dari ?? undefined, sampai ?? undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Laba / Rugi</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/laporan?type=laba-rugi${dari ? `&dari=${dari}` : ""}${sampai ? `&sampai=${sampai}` : ""}`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
          <a href="/pengurus/jurnal" className="text-sm text-primary hover:underline">← Kembali</a>
        </div>
      </div>
      <LabaRugiClient dari={dari ?? ""} sampai={sampai ?? ""} {...result} />
    </div>
  )
}
