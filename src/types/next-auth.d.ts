import NextAuth from "next-auth"
import { auth } from "@/lib/auth"

declare module "next-auth" {
  interface User {
    role?: string
    anggotaId?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      role: string
      anggotaId?: string
      name?: string | null
      image?: string | null
    }
  }
}
