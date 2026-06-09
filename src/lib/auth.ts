/**
 * @file src/lib/auth.ts
 * @description Konfigurasi autentikasi dan otorisasi menggunakan NextAuth.
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import { rateLimit } from "@/lib/rate-limit"
import { logger } from "@/lib/logger"

const { handlers, signIn, signOut, auth: rawAuth } = NextAuth({
  adapter: undefined,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email as string
        const password = credentials.password as string

        const rlKey = `login:${email}`
        const rl = await rateLimit(rlKey, 5, 60_000)
        if (!rl.success) {
          logger.warn("Rate limit exceeded", { email })
          throw new Error("Terlalu banyak percobaan. Silakan coba lagi dalam 1 menit.")
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { anggota: true },
        })

        if (!user || !user.isActive) {
          await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
          await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role,
          anggotaId: user.anggota?.id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as string
        token.anggotaId = user.anggotaId as string | undefined
        token.id = user.id as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.anggotaId = token.anggotaId as string | undefined
        session.user.id = token.id as string
      }
      return session
    },
  },
})

export { handlers, signIn, signOut }
export const auth = cache(rawAuth)

export async function assertRole(...roles: string[]) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (roles.length > 0 && !roles.includes(session.user.role as string)) {
    throw new Error("Forbidden")
  }
  return session
}
