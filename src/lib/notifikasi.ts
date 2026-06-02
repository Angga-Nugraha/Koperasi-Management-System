import { prisma } from "@/lib/prisma"
import { fcm } from "@/lib/firebase-admin"

type KirimNotifikasiParams = {
  userId: string
  title: string
  message: string
  type: string
  relatedId?: string
}

export async function kirimNotifikasi({ userId, title, message, type, relatedId }: KirimNotifikasiParams) {
  await prisma.notifikasi.create({
    data: { userId, title, message, type, relatedId },
  })

  const tokens = await prisma.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  })

  if (tokens.length === 0) return

  const registrationTokens = tokens.map((t) => t.token)
  try {
    await fcm.sendEachForMulticast({
      tokens: registrationTokens,
      notification: { title, body: message },
      data: { type: type ?? "", relatedId: relatedId ?? "" },
    })
  } catch {
    // silent — token may be invalid/expired
  }
}
