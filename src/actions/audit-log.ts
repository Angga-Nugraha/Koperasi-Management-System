"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

type GetAuditLogsParams = {
  entityType?: string
  action?: string
  page?: number
  pageSize?: number
}

export async function getAuditLogs(params: GetAuditLogsParams = {}) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA" && session.user.role !== "PENGAWAS")) {
    throw new Error("Unauthorized")
  }

  const { entityType, action, page = 1, pageSize = 30 } = params

  const where: Record<string, unknown> = {}
  if (entityType && entityType !== "SEMUA") where.entityType = entityType
  if (action && action !== "SEMUA") where.action = action

  const [raw, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ])

  const userIds = [...new Set(raw.map((l) => l.userId).filter(Boolean) as string[])]
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } })
    : []
  const userMap = new Map(users.map((u) => [u.id, u.email]))

  const data = raw.map((l) => ({
    id: l.id,
    userId: l.userId,
    userEmail: l.userId ? (userMap.get(l.userId) ?? "Unknown") : "-",
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId,
    oldValue: l.oldValue,
    newValue: l.newValue,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}
