import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 })
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isValid) {
    return NextResponse.json({ error: "Password saat ini salah" }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  return NextResponse.json({ success: true })
}
