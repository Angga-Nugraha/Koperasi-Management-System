/**
 * @file src/lib/notifikasi.ts
 * @description Helper untuk mengirim notifikasi ke database dan push notification perangkat via FCM.
 */

import { prisma, PrismaTx } from "@/lib/prisma"
import { getFcm } from "@/lib/firebase-admin"

type KirimNotifikasiParams = {
  userId: string
  title: string
  message: string
  type: string
  relatedId?: string
}

export async function kirimNotifikasi(
  { userId, title, message, type, relatedId }: KirimNotifikasiParams,
  tx?: PrismaTx,
) {
  const client = tx ?? prisma
  await client.notifikasi.create({
    data: { userId, title, message, type, relatedId },
  })

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  const tokens = await client.deviceToken.findMany({
    where: { userId },
    select: { token: true },
  })

  if (tokens.length === 0) return

  const registrationTokens = tokens.map((t) => t.token)
  try {
    const fcm = getFcm()
    await fcm.sendEachForMulticast({
      tokens: registrationTokens,
      notification: { title, body: message },
      data: { type: type ?? "", relatedId: relatedId ?? "", role: user?.role ?? "" },
    })
  } catch {
    // silent — Firebase not configured, token invalid/expired, etc.
  }
}

export async function notifyAdmins(
  params: { title: string; message: string; type: string; relatedId?: string },
  tx?: PrismaTx,
) {
  const client = tx ?? prisma
  const admins = await client.user.findMany({
    where: { role: { in: ["ADMIN", "PENGURUS", "BENDAHARA"] }, isActive: true },
    select: { id: true },
  })
  await Promise.all(
    admins.map((admin) =>
      kirimNotifikasi(
        {
          userId: admin.id,
          title: params.title,
          message: params.message,
          type: params.type,
          relatedId: params.relatedId,
        },
        tx,
      ),
    ),
  )
}

export async function notifyMember(
  params: { anggotaId: string; title: string; message: string; type: string; relatedId?: string },
  tx?: PrismaTx,
) {
  const client = tx ?? prisma
  const anggotaUser = await client.user.findUnique({ where: { anggotaId: params.anggotaId } })
  if (anggotaUser) {
    await kirimNotifikasi(
      {
        userId: anggotaUser.id,
        title: params.title,
        message: params.message,
        type: params.type,
        relatedId: params.relatedId,
      },
      tx,
    )
  }
}
