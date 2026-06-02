import { notFound } from "next/navigation"
import { getNeraca, getLabaRugi, getArusKas, getNeracaSaldo, getBukuBesar } from "@/actions/jurnal"
import { getAuditLogs } from "@/actions/audit-log"
import { getAkunList } from "@/actions/konfigurasi"
import { NeracaClient } from "@/components/jurnal/neraca-client"
import { LabaRugiClient } from "@/components/jurnal/laba-rugi-client"
import { ArusKasClient } from "@/components/jurnal/arus-kas-client"
import { NeracaSaldoClient } from "@/components/jurnal/neraca-saldo-client"
import { BukuBesarClient } from "@/components/jurnal/buku-besar-client"
import { AuditLogTable } from "@/components/jurnal/audit-log-table"
import { FileSpreadsheet } from "lucide-react"

type Props = {
  params: Promise<{ jenis: string }>
  searchParams: Promise<{ sampai?: string; dari?: string; akunId?: string; page?: string; pageSize?: string; entityType?: string; action?: string }>
}

const JENIS_LIST = ["neraca", "laba-rugi", "arus-kas", "neraca-saldo", "buku-besar", "audit-log"] as const

const LABEL: Record<string, string> = {
  neraca: "Neraca",
  "laba-rugi": "Laba / Rugi",
  "arus-kas": "Arus Kas",
  "neraca-saldo": "Neraca Saldo",
  "buku-besar": "Buku Besar",
  "audit-log": "Audit Log",
}

export default async function LaporanJenisPage({ params, searchParams }: Props) {
  const { jenis } = await params
  const { sampai, dari, akunId, page, pageSize: ps, entityType, action } = await searchParams
  const pageSize = Number(ps) || 20

  if (!JENIS_LIST.includes(jenis as typeof JENIS_LIST[number])) {
    notFound()
  }

  const exportUrl = `/api/export/laporan?type=${jenis}${sampai ? `&sampai=${sampai}` : ""}${dari ? `&dari=${dari}` : ""}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{LABEL[jenis] ?? jenis}</h1>
        </div>
        <a
          href={exportUrl}
          target="_blank"
          className="w-fit rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
        >
          <FileSpreadsheet className="mr-1 inline h-4 w-4" />
          Export Excel
        </a>
      </div>
      <LaporanContent jenis={jenis} sampai={sampai ?? ""} dari={dari ?? ""} akunId={akunId ?? ""} page={page ?? "1"} pageSize={pageSize} entityType={entityType} action={action} />
    </div>
  )
}

async function LaporanContent({ jenis, sampai, dari, akunId, page, pageSize, entityType, action }: { jenis: string; sampai: string; dari: string; akunId?: string; page?: string; pageSize: number; entityType?: string; action?: string }) {
  const tahunIni = new Date().getFullYear()
  const defaultDari = `${tahunIni}-01-01`
  const defaultSampai = new Date().toISOString().split("T")[0]

  switch (jenis) {
    case "neraca": {
      const s = sampai || defaultSampai
      const result = await getNeraca(s)
      return <NeracaClient sampai={s} {...result} />
    }
    case "laba-rugi": {
      const d = dari || defaultDari
      const s = sampai || defaultSampai
      const result = await getLabaRugi(d, s)
      return <LabaRugiClient dari={d} sampai={s} {...result} />
    }
    case "arus-kas": {
      const d = dari || defaultDari
      const s = sampai || defaultSampai
      const pageNum = Number(page) || 1
      const result = await getArusKas(d, s, pageNum, pageSize)
      return <ArusKasClient dari={d} sampai={s} {...result} pageSize={pageSize} />
    }
    case "neraca-saldo": {
      const s = sampai || defaultSampai
      const result = await getNeracaSaldo(s)
      return <NeracaSaldoClient sampai={s} {...result} />
    }
    case "buku-besar": {
      const pageNum = Number(page) || 1
      const d = dari || defaultDari
      const s = sampai || defaultSampai
      const [akunList, page1] = await Promise.all([
        getAkunList(),
        getBukuBesar(akunId || undefined, d, s, pageNum, pageSize),
      ])
      const akunTerpilih = akunId ? akunList.find((a) => a.id === akunId) ?? null : null
      return <BukuBesarClient akunList={akunList} akunId={akunId ?? ""} dari={d} sampai={s} detail={page1.data as any} akunTerpilih={akunTerpilih} page={page1.page} totalPages={page1.totalPages} pageSize={pageSize} />
    }
    case "audit-log": {
      const pageNum = Number(page) || 1
      const result = await getAuditLogs({ entityType, action, page: pageNum, pageSize })
      return <AuditLogTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={pageSize}
        entityType={entityType ?? "SEMUA"}
        action={action ?? "SEMUA"}
      />
    }
    default:
      return null
  }
}
