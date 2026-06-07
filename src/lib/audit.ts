/**
 * @file src/lib/audit.ts
 * @description Utilitas untuk mencatat log audit aktivitas pengguna ke database.
 */

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type CatatLogParams = {
  userId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  oldValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
}

export async function catatLog(params: CatatLogParams, tx?: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">) {
  if (!params.userId) return

  let userEmail: string | null = null
  try {
    const session = await auth()
    userEmail = session?.user?.email ?? null
  } catch {
    try {
      const client = tx ?? prisma
      const user = await client.user.findUnique({ where: { id: params.userId }, select: { email: true } })
      userEmail = user?.email ?? null
    } catch {}
  }

  const client = tx ?? prisma
  await client.auditLog.create({
    data: {
      userId: params.userId,
      userEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValue: (params.oldValue ?? Prisma.DbNull) as Prisma.InputJsonValue,
      newValue: (params.newValue ?? Prisma.DbNull) as Prisma.InputJsonValue,
    },
  })
}
