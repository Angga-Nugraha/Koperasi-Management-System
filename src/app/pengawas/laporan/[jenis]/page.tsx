import { notFound } from "next/navigation"
import { getNeraca, getLabaRugi, getArusKas, getNeracaSaldo, getBukuBesar } from "@/actions/jurnal"
import { getSHUList } from "@/actions/shu"
import { getAkunList } from "@/actions/konfigurasi"
import { NeracaClient } from "@/components/jurnal/neraca-client"
import { LabaRugiClient } from "@/components/jurnal/laba-rugi-client"
import { ArusKasClient } from "@/components/jurnal/arus-kas-client"
import { NeracaSaldoClient } from "@/components/jurnal/neraca-saldo-client"
import { BukuBesarClient } from "@/components/jurnal/buku-besar-client"
import { SHUList } from "@/components/shu/shu-list"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Props = {
  params: Promise<{ jenis: string }>
  searchParams: Promise<{ sampai?: string; dari?: string; akunId?: string; page?: string }>
}

const JENIS_LIST = ["neraca", "laba-rugi", "arus-kas", "neraca-saldo", "buku-besar", "shu"] as const

const LABEL: Record<string, string> = {
  neraca: "Neraca",
  "laba-rugi": "Laba / Rugi",
  "arus-kas": "Arus Kas",
  "neraca-saldo": "Neraca Saldo",
  "buku-besar": "Buku Besar",
  shu: "SHU",
}

export default async function LaporanJenisPage({ params, searchParams }: Props) {
  const { jenis } = await params
  const { sampai, dari, akunId, page } = await searchParams

  if (!JENIS_LIST.includes(jenis as typeof JENIS_LIST[number])) {
    notFound()
  }

  const exportUrl = `/api/export/laporan?type=${jenis}${sampai ? `&sampai=${sampai}` : ""}${dari ? `&dari=${dari}` : ""}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pengawas/laporan">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{LABEL[jenis] ?? jenis}</h1>
          </div>
        </div>
        <a
          href={exportUrl}
          target="_blank"
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
        >
          <FileSpreadsheet className="mr-1 inline h-4 w-4" />
          Export Excel
        </a>
      </div>
      <LaporanContent jenis={jenis} sampai={sampai ?? ""} dari={dari ?? ""} akunId={akunId ?? ""} page={page ?? "1"} />
    </div>
  )
}

async function LaporanContent({ jenis, sampai, dari, akunId, page }: { jenis: string; sampai: string; dari: string; akunId?: string; page?: string }) {
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
      const result = await getArusKas(s)
      return <ArusKasClient dari={d} sampai={s} {...result} />
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
        getBukuBesar(akunId || undefined, d, s, pageNum),
      ])
      const akunTerpilih = akunId ? akunList.find((a) => a.id === akunId) ?? null : null
      return <BukuBesarClient akunList={akunList} akunId={akunId ?? ""} dari={d} sampai={s} detail={page1.data as any} akunTerpilih={akunTerpilih} page={page1.page} totalPages={page1.totalPages} />
    }
    case "shu": {
      const shuList = await getSHUList()
      return <SHUList data={shuList} />
    }
    default:
      return null
  }
}
