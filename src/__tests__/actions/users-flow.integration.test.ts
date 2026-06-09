import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    anggota: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => {
  const mockSession = { user: { id: "admin-1", email: "admin@test.com", role: "ADMIN" as const } }
  return {
    assertRole: vi.fn().mockResolvedValue(mockSession),
    auth: vi.fn().mockResolvedValue(mockSession),
  }
})

vi.mock("@/lib/audit", () => ({ catatLog: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

describe("Users Flow Integration", () => {
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    prisma = (await import("@/lib/prisma")).prisma
  })

  describe("createUser", () => {
    let createUser: (typeof import("@/actions/users"))["createUser"]

    beforeEach(async () => {
      const mod = await import("@/actions/users")
      createUser = mod.createUser
    })

    it("rejects mismatched passwords", async () => {
      await expect(
        createUser({
          email: "test@mail.com",
          password: "secret123",
          confirmPassword: "different",
          role: "ANGGOTA",
        }),
      ).rejects.toThrow()
    })

    it("rejects invalid email", async () => {
      await expect(
        createUser({
          email: "invalid",
          password: "secret123",
          confirmPassword: "secret123",
          role: "ANGGOTA",
        }),
      ).rejects.toThrow()
    })

    it("creates user successfully", async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: "user-1",
        email: "test@mail.com",
        role: "ANGGOTA",
      })

      const result = await createUser({
        email: "test@mail.com",
        password: "secret123",
        confirmPassword: "secret123",
        role: "ANGGOTA",
      })

      expect(result.success).toBe(true)
    })

    it("creates user with anggotaId", async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.anggota.findUnique.mockResolvedValue({ id: "a1", nama: "Budi" })
      prisma.user.create.mockResolvedValue({ id: "user-1" })

      const result = await createUser({
        email: "budi@mail.com",
        password: "secret123",
        confirmPassword: "secret123",
        role: "ANGGOTA",
        anggotaId: "a1",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("updateUser", () => {
    let updateUser: (typeof import("@/actions/users"))["updateUser"]

    beforeEach(async () => {
      const mod = await import("@/actions/users")
      updateUser = mod.updateUser
    })

    it("rejects invalid email", async () => {
      await expect(
        updateUser({ id: "u1", email: "invalid", role: "ANGGOTA", isActive: true }),
      ).rejects.toThrow()
    })

    it("updates user successfully", async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: "u1", email: "old@mail.com", role: "ANGGOTA", isActive: true })
        .mockResolvedValueOnce(null)
      prisma.user.update.mockResolvedValue({ id: "u1", email: "new@mail.com" })

      const result = await updateUser({
        id: "u1",
        email: "new@mail.com",
        role: "ANGGOTA",
        isActive: true,
      })

      expect(result.success).toBe(true)
    })
  })

  describe("resetPassword", () => {
    let resetPassword: (typeof import("@/actions/users"))["resetPassword"]

    beforeEach(async () => {
      const mod = await import("@/actions/users")
      resetPassword = mod.resetPassword
    })

    it("rejects mismatched passwords", async () => {
      await expect(
        resetPassword({ userId: "u1", password: "secret123", confirmPassword: "different" }),
      ).rejects.toThrow()
    })

    it("resets password successfully", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "test@mail.com" })
      prisma.user.update.mockResolvedValue({ id: "u1" })

      const result = await resetPassword({
        userId: "u1",
        password: "newpass123",
        confirmPassword: "newpass123",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("toggleUserActive", () => {
    let toggleUserActive: (typeof import("@/actions/users"))["toggleUserActive"]

    beforeEach(async () => {
      const mod = await import("@/actions/users")
      toggleUserActive = mod.toggleUserActive
    })

    it("toggles active status", async () => {
      prisma.user.findUnique.mockResolvedValue({ id: "u1", isActive: false })
      prisma.user.update.mockResolvedValue({ id: "u1", isActive: true })

      const result = await toggleUserActive("u1")

      expect(result.success).toBe(true)
    })
  })
})
