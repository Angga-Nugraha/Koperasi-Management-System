/**
 * @file src/actions/audit-log.ts
 * @description Server Action untuk mengambil data audit log aktivitas pengguna.
 */

"use server"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { assertRole } from "@/lib/auth"

type GetAuditLogsParams = {
  entityType?: string
  action?: string
  page?: number
  pageSize?: number
}

export async function getAuditLogs(params: GetAuditLogsParams = {}) {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA", "PENGAWAS")

  const { entityType, action, page = 1, pageSize = 20 } = params

  const where: Prisma.AuditLogWhereInput = {}
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
