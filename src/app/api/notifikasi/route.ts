import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const data = await prisma.notifikasi.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unread = await prisma.notifikasi.count({
    where: { userId: session.user.id, isRead: false },
  })

  return NextResponse.json({ data, unread })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids, all } = await req.json()

  if (all) {
    await prisma.notifikasi.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true },
    })
  } else if (Array.isArray(ids)) {
    await prisma.notifikasi.updateMany({
      where: { id: { in: ids }, userId: session.user.id },
      data: { isRead: true },
    })
  }

  return NextResponse.json({ success: true })
}
