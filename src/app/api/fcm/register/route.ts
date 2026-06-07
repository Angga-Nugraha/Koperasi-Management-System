/**
 * @file src/app/api/fcm/register/route.ts
 * @description Route Handler API untuk endpoint /api/fcm/register/route.ts
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Endpoint API untuk mendaftarkan atau memperbarui token perangkat (FCM token) pengguna saat ini.
export async function POST(req: Request) {
  // Validasi sesi/login pengguna.
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Memvalidasi keberadaan token.
  const token = typeof body.token === "string" ? body.token.trim() : ""
  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Token required" }, { status: 400 })
  }

  // Memastikan token yang sama tidak terdaftar atas nama pengguna lain.
  const existing = await prisma.deviceToken.findUnique({ where: { token } })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Token already registered to another user" }, { status: 409 })
  }

  // Menyimpan/memperbarui asosiasi antara token FCM perangkat dengan ID user.
  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: session.user.id },
    create: { userId: session.user.id, token },
  })

  return NextResponse.json({ success: true })
}
