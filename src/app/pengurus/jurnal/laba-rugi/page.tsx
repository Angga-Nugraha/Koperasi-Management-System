/**
 * @file src/app/pengurus/jurnal/laba-rugi/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getLabaRugi } from "@/actions/jurnal"
import { LabaRugiClient } from "@/components/jurnal/laba-rugi-client"

type Props = {
  searchParams: Promise<{ dari?: string; sampai?: string }>
}

export default async function LabaRugiPage({ searchParams }: Props) {
  const { dari: dariParam, sampai: sampaiParam } = await searchParams
  const tahunIni = new Date().getFullYear()
  const dari = (dariParam || `${tahunIni}-01-01`) as string
  const sampai = (sampaiParam || new Date().toISOString().split("T")[0]) as string
  const result = await getLabaRugi(dari, sampai)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Laba / Rugi" />
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/laporan?type=laba-rugi&dari=${dari}&sampai=${sampai}`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
        </div>
      </div>
      <LabaRugiClient dari={dari} sampai={sampai} {...result} />
    </div>
  )
}
