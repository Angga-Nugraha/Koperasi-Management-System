/**
 * @file src/app/layout.tsx
 * @description Modul fungsionalitas: layout.tsx.
 */

import type { Metadata } from "next"
import { Providers } from "@/lib/providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "Simko - Sistem Manajemen Koperasi",
  description: "Sistem Manajemen Koperasi Terintegrasi",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
