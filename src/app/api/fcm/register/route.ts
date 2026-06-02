import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const token = typeof body.token === "string" ? body.token.trim() : ""
  if (!token || token.length < 10) {
    return NextResponse.json({ error: "Token required" }, { status: 400 })
  }

  const existing = await prisma.deviceToken.findUnique({ where: { token } })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Token already registered to another user" }, { status: 409 })
  }

  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: session.user.id },
    create: { userId: session.user.id, token },
  })

  return NextResponse.json({ success: true })
}
