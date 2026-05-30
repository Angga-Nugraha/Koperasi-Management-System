import { prisma } from "@/lib/prisma"

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

  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
    },
  })
}
