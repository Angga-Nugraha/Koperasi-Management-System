"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import { FcmProvider } from "@/components/fcm-provider"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FcmProvider>{children}</FcmProvider>
    </SessionProvider>
  )
}
