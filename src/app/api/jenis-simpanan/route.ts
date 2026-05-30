import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const raw = await prisma.jenisSimpanan.findMany({
    where: { isActive: true },
    orderBy: { urutan: "asc" },
  })

  const data = raw.map((j) => ({
    id: j.id,
    kode: j.kode,
    nama: j.nama,
    minimalSetoran: Number(j.minimalSetoran),
    keterangan: j.keterangan,
  }))

  return NextResponse.json(data)
}
