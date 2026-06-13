/**
 * @file src/app/api/export/laporan/route.ts
 * @description Route Handler API untuk endpoint /api/export/laporan/route.ts
 */

import { auth } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import {
  exportBukuBesar,
  exportNeracaSaldo,
  exportNeraca,
  exportLabaRugi,
  exportArusKas,
  exportSHU,
} from "@/actions/export-laporan"

const EXPORTERS: Record<
  string,
  (p: { dari?: string; sampai?: string; akunId?: string }) => Promise<Uint8Array>
> = {
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

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const dari = searchParams.get("dari") ?? undefined
    const sampai = searchParams.get("sampai") ?? undefined
    const akunId = searchParams.get("akunId") ?? undefined

    if (!type || !EXPORTERS[type]) {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }
    if (dari && !DATE_REGEX.test(dari)) {
      return NextResponse.json(
        { error: "Format tanggal 'dari' tidak valid (YYYY-MM-DD)" },
        { status: 400 },
      )
    }
    if (sampai && !DATE_REGEX.test(sampai)) {
      return NextResponse.json(
        { error: "Format tanggal 'sampai' tidak valid (YYYY-MM-DD)" },
        { status: 400 },
      )
    }
    if (akunId && !UUID_REGEX.test(akunId)) {
      return NextResponse.json({ error: "Format akunId tidak valid" }, { status: 400 })
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
      { status: 500 },
    )
  }
}
