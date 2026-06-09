/**
 * @file src/app/api/export/jurnal-excel/route.ts
 * @description Route Handler API untuk endpoint /api/export/jurnal-excel/route.ts
 */

import { exportJurnalExcel } from "@/actions/export"
import { NextRequest, NextResponse } from "next/server"

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dari = searchParams.get("dari") ?? undefined
    const sampai = searchParams.get("sampai") ?? undefined

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

    const buffer = await exportJurnalExcel({
      search: searchParams.get("search") ?? undefined,
      dari,
      sampai,
    })

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="jurnal-umum-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 },
    )
  }
}
