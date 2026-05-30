import { getSHU } from "@/actions/jurnal"
import { SHUClient } from "@/components/jurnal/shu-client"

type Props = {
  searchParams: Promise<{ dari?: string; sampai?: string }>
}

export default async function SHUPage({ searchParams }: Props) {
  const { dari, sampai } = await searchParams
  const result = await getSHU(dari ?? undefined, sampai ?? undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sisa Hasil Usaha (SHU)</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/laporan?type=shu${dari ? `&dari=${dari}` : ""}${sampai ? `&sampai=${sampai}` : ""}`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
          <a href="/pengurus/jurnal" className="text-sm text-primary hover:underline">← Kembali</a>
        </div>
      </div>
      <SHUClient dari={dari ?? ""} sampai={sampai ?? ""} {...result} />
    </div>
  )
}
