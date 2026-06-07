/**
 * @file src/app/pengurus/jurnal/neraca/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { getNeraca } from "@/actions/jurnal"
import { NeracaClient } from "@/components/jurnal/neraca-client"

type Props = {
  searchParams: Promise<{ sampai?: string }>
}

export default async function NeracaPage({ searchParams }: Props) {
  const { sampai } = await searchParams
  const result = await getNeraca(sampai ?? undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Neraca</h1>
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/laporan?type=neraca${sampai ? `&sampai=${sampai}` : ""}`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
        </div>
      </div>
      <NeracaClient sampai={sampai ?? ""} {...result} />
    </div>
  )
}
