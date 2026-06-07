"use client"

/**
 * @file src/lib/providers.tsx
 * @description Kumpulan provider global Next.js (Session, Theme, dan FCM Provider) untuk sisi klien.
 */

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"
import { FcmProvider } from "@/components/fcm-provider"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        <FcmProvider>
          {children}
          <Toaster />
        </FcmProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
