/**
 * @file src/actions/users.ts
 * @description Server Action untuk mengelola pengguna (staff, pengurus, pengawas) dan otorisasi.
 */

"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { catatLog } from "@/lib/audit"
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/validations/user"

const ROLE_HIERARCHY: Record<string, number> = {
  ADMIN: 5,
  PENGURUS: 4,
  BENDAHARA: 3,
  PENGAWAS: 2,
  ANGGOTA: 1,
}

async function assertCanManageRole(targetRole: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  const userRole = session.user.role as string
  if (!["ADMIN", "PENGURUS", "BENDAHARA"].includes(userRole)) throw new Error("Unauthorized")
  if (
    userRole !== "ADMIN" &&
    (ROLE_HIERARCHY[targetRole] ?? 0) >= (ROLE_HIERARCHY[userRole] ?? 0)
  ) {
    throw new Error("Tidak bisa mengelola user dengan role yang sama atau di atas role Anda")
  }
}

export async function getUserList(q?: string, page = 1, pageSize = 10) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }

  const where = q ? { email: { contains: q } } : undefined
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { anggota: { select: { id: true, nama: true, noAnggota: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ])

  return {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      anggotaId: u.anggotaId,
      anggota: u.anggota
        ? { id: u.anggota.id, nama: u.anggota.nama, noAnggota: u.anggota.noAnggota }
        : null,
      createdAt: u.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getAnggotaTanpaUser(includeId?: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }

  const anggota = await prisma.anggota.findMany({
    where: {
      status: "AKTIF",
      OR: [{ user: null }, ...(includeId ? [{ id: includeId }] : [])],
    },
    select: { id: true, nama: true, noAnggota: true },
    orderBy: { nama: "asc" },
  })
  return anggota
}

export async function createUser(input: CreateUserInput) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }

  const parsed = createUserSchema.parse(input)
  await assertCanManageRole(parsed.role)

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } })
  if (existing) throw new Error("Email sudah digunakan")

  if (parsed.anggotaId) {
    const anggotaAda = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
    if (!anggotaAda) throw new Error("Anggota tidak ditemukan")
    const sudahPunyaUser = await prisma.user.findUnique({ where: { anggotaId: parsed.anggotaId } })
    if (sudahPunyaUser) throw new Error("Anggota sudah memiliki user account")
  }

  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash: await bcrypt.hash(parsed.password, 10),
      role: parsed.role,
      anggotaId: parsed.anggotaId ?? null,
      isActive: true,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "USER",
    entityId: user.id,
    newValue: { email: parsed.email, role: parsed.role },
  })

  revalidatePath("/pengurus/users")
  return { success: true }
}

export async function updateUser(input: UpdateUserInput) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }

  const parsed = updateUserSchema.parse(input)
  const existing = await prisma.user.findUnique({ where: { id: parsed.id } })
  if (!existing) throw new Error("User tidak ditemukan")

  if (parsed.id === session.user.id && parsed.role !== existing.role) {
    throw new Error("Tidak bisa mengubah role sendiri")
  }

  await assertCanManageRole(parsed.role)

  if (parsed.email !== existing.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (emailExists) throw new Error("Email sudah digunakan")
  }

  if (parsed.anggotaId && parsed.anggotaId !== existing.anggotaId) {
    const sudahPunyaUser = await prisma.user.findUnique({ where: { anggotaId: parsed.anggotaId } })
    if (sudahPunyaUser) throw new Error("Anggota sudah memiliki user account")
  }

  await prisma.user.update({
    where: { id: parsed.id },
    data: {
      email: parsed.email,
      role: parsed.role,
      isActive: parsed.isActive,
      anggotaId: parsed.anggotaId ?? null,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "USER",
    entityId: parsed.id,
    newValue: { email: parsed.email, role: parsed.role, isActive: parsed.isActive },
    oldValue: { email: existing.email, role: existing.role, isActive: existing.isActive },
  })

  revalidatePath("/pengurus/users")
  return { success: true }
}

export async function resetPassword(input: {
  userId: string
  password: string
  confirmPassword: string
}) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }

  const parsed = resetPasswordSchema.parse(input)
  const user = await prisma.user.findUnique({ where: { id: parsed.userId } })
  if (!user) throw new Error("User tidak ditemukan")
  await assertCanManageRole(user.role)

  await prisma.user.update({
    where: { id: parsed.userId },
    data: { passwordHash: await bcrypt.hash(parsed.password, 10) },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "USER",
    entityId: parsed.userId,
    newValue: { action: "reset_password" },
  })

  return { success: true }
}

export async function toggleUserActive(userId: string) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }

  if (userId === session.user.id) throw new Error("Tidak bisa menonaktifkan akun sendiri")

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User tidak ditemukan")
  await assertCanManageRole(user.role)

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "USER",
    entityId: userId,
    newValue: { isActive: !user.isActive },
  })

  revalidatePath("/pengurus/users")
  return { success: true, isActive: !user.isActive }
}

const ROLE_ABOVE: Record<string, string[]> = {
  ADMIN: ["PENGURUS", "BENDAHARA", "PENGAWAS", "ANGGOTA"],
  PENGURUS: ["BENDAHARA", "PENGAWAS", "ANGGOTA"],
  BENDAHARA: ["PENGAWAS", "ANGGOTA"],
  PENGAWAS: ["ANGGOTA"],
  ANGGOTA: [],
}

export async function getAllowedRoles() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "PENGURUS", "BENDAHARA"].includes(session.user.role as string)) {
    throw new Error("Unauthorized")
  }
  return ROLE_ABOVE[session.user.role as string] ?? []
}
