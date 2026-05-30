import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/lib/providers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="id">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
