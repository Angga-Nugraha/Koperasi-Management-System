/**
 * @file src/app/pengurus/jurnal/neraca-saldo/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getNeracaSaldo } from "@/actions/jurnal"
import { NeracaSaldoClient } from "@/components/jurnal/neraca-saldo-client"

type Props = {
  searchParams: Promise<{ sampai?: string }>
}

export default async function NeracaSaldoPage({ searchParams }: Props) {
  const { sampai } = await searchParams
  const result = await getNeracaSaldo(sampai ?? undefined)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Neraca Saldo" />
        <div className="flex items-center gap-2">
          <a
            href={`/api/export/laporan?type=neraca-saldo${sampai ? `&sampai=${sampai}` : ""}`}
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
        </div>
      </div>

      <NeracaSaldoClient
        sampai={sampai ?? ""}
        data={result.data}
        totalDebit={result.totalDebit}
        totalKredit={result.totalKredit}
      />
    </div>
  )
}
