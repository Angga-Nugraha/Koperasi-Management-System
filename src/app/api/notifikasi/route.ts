/**
 * @file src/app/api/notifikasi/route.ts
 * @description Route Handler API untuk endpoint /api/notifikasi/route.ts
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [data, unread] = await Promise.all([
    prisma.notifikasi.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notifikasi.count({
      where: { userId: session.user.id, isRead: false },
    }),
  ])

  return NextResponse.json({ data, unread })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const all = body.all === true
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id: unknown) => typeof id === "string" && id.length > 0)
    : []

  if (all) {
    await prisma.notifikasi.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    })
  } else if (ids.length > 0) {
    await prisma.notifikasi.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
