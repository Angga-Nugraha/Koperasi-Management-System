import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

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

  const ext = MIME_TO_EXT[file.type] ?? "jpg"
  const filename = `${uploadType}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const subDir = uploadType === "logo" ? "logo" : "anggota"
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir)

  await mkdir(uploadDir, { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${subDir}/${filename}` })
}
