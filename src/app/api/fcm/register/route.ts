import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: session.user.id },
    create: { userId: session.user.id, token },
  })

  return NextResponse.json({ success: true })
}
