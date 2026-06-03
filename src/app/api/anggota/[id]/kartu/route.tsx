import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { renderToStream } from "@react-pdf/renderer"
import { KartuAnggota } from "@/lib/pdf/kartu-anggota"
import { readFile } from "fs/promises"
import path from "path"

async function resolveImageUrl(url: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const filePath = path.join(process.cwd(), "public", url)
    const buffer = await readFile(filePath)
    const ext = path.extname(url).slice(1)
    const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
    return `data:${mime};base64,${buffer.toString("base64")}`
  } catch {
    return null
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [anggota, generalInfo] = await Promise.all([
    prisma.anggota.findUnique({ where: { id } }),
    prisma.generalInfo.findFirst(),
  ])

  if (!anggota) {
    return NextResponse.json({ error: "Anggota tidak ditemukan" }, { status: 404 })
  }

  const [foto, logo] = await Promise.all([
    resolveImageUrl(anggota.foto),
    resolveImageUrl(generalInfo?.logo ?? null),
  ])

  const stream = await renderToStream(
    <KartuAnggota
      nama={anggota.nama}
      noAnggota={anggota.noAnggota}
      nik={anggota.nik}
      alamat={anggota.alamat}
      pekerjaan={anggota.pekerjaan}
      foto={foto}
      tglMasuk={anggota.tglMasuk.toISOString()}
      namaKoperasi={generalInfo?.namaKoperasi ?? "KOPERASI"}
      logo={logo}
    />
  )

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="kartu-anggota-${anggota.noAnggota}.pdf"`,
    },
  })
}
