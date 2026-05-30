import { exportJurnalExcel } from "@/actions/export"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const buffer = await exportJurnalExcel({
      search: searchParams.get("search") ?? undefined,
      dari: searchParams.get("dari") ?? undefined,
      sampai: searchParams.get("sampai") ?? undefined,
    })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="jurnal-umum-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Export failed" },
      { status: 500 }
    )
  }
}
