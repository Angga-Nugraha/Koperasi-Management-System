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

  const { entityType, action, page = 1, pageSize = 20 } = params

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

  const missingEmailIds = [...new Set(raw.filter((l) => l.userId && !l.userEmail).map((l) => l.userId!))]
  const emailMap = new Map<string, string>()
  if (missingEmailIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: missingEmailIds } },
      select: { id: true, email: true },
    })
    for (const u of users) {
      emailMap.set(u.id, u.email)
    }
  }

  const data = raw.map((l) => {
    const email = l.userEmail ?? (l.userId ? emailMap.get(l.userId) : undefined)
    return {
      id: l.id,
      userId: l.userId,
      userEmail: email ?? "Unknown",
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      detail: [l.oldValue, l.newValue].filter(Boolean).map((v) => JSON.stringify(v)).join(" → ") || "-",
      ipAddress: l.ipAddress,
      createdAt: l.createdAt.toISOString(),
    }
  })

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}
