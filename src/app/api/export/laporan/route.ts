import { NextRequest, NextResponse } from "next/server"
import {
  exportBukuBesar,
  exportNeracaSaldo,
  exportNeraca,
  exportLabaRugi,
  exportArusKas,
  exportSHU,
} from "@/actions/export-laporan"

const EXPORTERS: Record<string, (p: { dari?: string; sampai?: string; akunId?: string }) => Promise<Uint8Array>> = {
  "buku-besar": exportBukuBesar,
  "neraca-saldo": exportNeracaSaldo,
  neraca: exportNeraca,
  "laba-rugi": exportLabaRugi,
  "arus-kas": exportArusKas,
  shu: exportSHU,
}

const FILE_NAMES: Record<string, string> = {
  "buku-besar": "buku-besar",
  "neraca-saldo": "neraca-saldo",
  neraca: "neraca",
  "laba-rugi": "laba-rugi",
  "arus-kas": "arus-kas",
  shu: "shu",
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const dari = searchParams.get("dari") ?? undefined
    const sampai = searchParams.get("sampai") ?? undefined
    const akunId = searchParams.get("akunId") ?? undefined

    if (!type || !EXPORTERS[type]) {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }

    const buffer = await EXPORTERS[type]({ dari, sampai, akunId })
    const name = FILE_NAMES[type] ?? type

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    )
  }
}
