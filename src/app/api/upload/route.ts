import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const uploadType = formData.get("type") as string | null

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipe file harus JPG/PNG/WebP" }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File maksimal 2MB" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `${uploadType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const subDir = uploadType === "logo" ? "logo" : "anggota"
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir)

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${subDir}/${filename}` })
}
