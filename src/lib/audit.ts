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

export async function catatLog(params: CatatLogParams) {
  if (!params.userId) return

  let userEmail: string | null = null
  try {
    const session = await auth()
    userEmail = session?.user?.email ?? null
  } catch {
    try {
      const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { email: true } })
      userEmail = user?.email ?? null
    } catch {}
  }

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      userEmail,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValue: params.oldValue as any,
      newValue: params.newValue as any,
    },
  })
}
