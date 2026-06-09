/**
 * @file src/lib/validations/user.ts
 * @description Skema validasi Zod untuk data pengguna dan password.
 */

import { z } from "zod"

export const createUserSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
    role: z.enum(["ADMIN", "PENGURUS", "BENDAHARA", "PENGAWAS", "ANGGOTA"]),
    anggotaId: z.string().optional().nullable(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  })

export const updateUserSchema = z.object({
  id: z.string(),
  email: z.string().email("Email tidak valid"),
  role: z.enum(["ADMIN", "PENGURUS", "BENDAHARA", "PENGAWAS", "ANGGOTA"]),
  isActive: z.boolean(),
  anggotaId: z.string().optional().nullable(),
})

export const resetPasswordSchema = z
  .object({
    userId: z.string(),
    password: z.string().min(6, "Password minimal 6 karakter"),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  })

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
