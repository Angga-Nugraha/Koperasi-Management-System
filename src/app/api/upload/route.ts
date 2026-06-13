/**
 * @file src/app/api/upload/route.ts
 * @description Route Handler API untuk endpoint /api/upload/route.ts
 */

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

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const UPLOAD_RATE_LIMIT_MAX = 10
const UPLOAD_RATE_LIMIT_WINDOW = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + UPLOAD_RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= UPLOAD_RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Terlalu banyak upload. Coba lagi dalam 1 menit." },
      { status: 429 },
    )
  }

  const session = await auth()
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" &&
      session.user.role !== "PENGURUS" &&
      session.user.role !== "BENDAHARA")
  ) {
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

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File maksimal 2MB" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const MAGIC_BYTES: Record<string, Uint8Array[]> = {
    "image/jpeg": [new Uint8Array([0xFF, 0xD8, 0xFF])],
    "image/png": [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
    "image/webp": [
      new Uint8Array([0x52, 0x49, 0x46, 0x46]),
      // Also check WEBP chunk at offset 8
    ],
  }

  function isWebP(buf: Buffer): boolean {
    if (buf[0] !== 0x52 || buf[1] !== 0x49 || buf[2] !== 0x46 || buf[3] !== 0x46) return false
    if (buf.length < 12) return false
    return buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  }

  const detectedType = Object.entries(MAGIC_BYTES).find(([type, sigs]) =>
    type === "image/webp" ? isWebP(buffer) : sigs.some((sig) => sig.every((b, i) => buffer[i] === b)),
  )?.[0]

  if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
    return NextResponse.json({ error: "File tidak valid atau bukan gambar" }, { status: 400 })
  }

  const ext = MIME_TO_EXT[detectedType] ?? "jpg"
  const noAnggota = formData.get("noAnggota") as string | null
  const filename = noAnggota
    ? `${uploadType}-${noAnggota}.${ext}`
    : `${uploadType}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const subDir =
    uploadType === "logo" ? "logo" : uploadType === "foto" ? "anggota/foto" : uploadType === "ktp" ? "anggota/ktp" : "anggota"
  const uploadDir = path.join(process.cwd(), "public", "uploads", subDir)

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${subDir}/${filename}` })
}
