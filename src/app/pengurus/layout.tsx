/**
 * @file src/app/pengurus/layout.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: layout.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"
import { NotifikasiBell } from "@/components/notifikasi-bell"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV_ITEMS: NavItem[] = [
  { href: "/pengurus", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/pengurus/anggota", label: "Anggota", icon: "Users" },
  { href: "/pengurus/simpanan", label: "Simpanan", icon: "PiggyBank" },
  { href: "/pengurus/pinjaman", label: "Pinjaman", icon: "HandCoins" },
  {
    href: "/pengurus/jurnal",
    label: "Akuntansi",
    icon: "BookOpen",
    children: [
      { href: "/pengurus/jurnal", label: "Jurnal Umum", icon: "BookOpen" },
      { href: "/pengurus/jurnal/buku-besar", label: "Buku Besar", icon: "BookText" },
      { href: "/pengurus/jurnal/neraca-saldo", label: "Neraca Saldo", icon: "FileSpreadsheet" },
      { href: "/pengurus/jurnal/neraca", label: "Neraca", icon: "FileChartColumn" },
      { href: "/pengurus/jurnal/laba-rugi", label: "Laba / Rugi", icon: "FileChartLine" },
      { href: "/pengurus/jurnal/arus-kas", label: "Arus Kas", icon: "ArrowRightLeft" },
      { href: "/pengurus/jurnal/audit-log", label: "Audit Log", icon: "ScrollText" },
    ],
  },
  { href: "/pengurus/shu", label: "SHU", icon: "Scale" },
  { href: "/pengurus/tutup-buku", label: "Tutup Buku", icon: "FileText" },
  { href: "/pengurus/users", label: "Users", icon: "UserCog" },
  { href: "/pengurus/konfigurasi", label: "Pengaturan", icon: "Settings" },
]

export default async function PengurusLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "ADMIN" && role !== "PENGURUS" && role !== "BENDAHARA") {
    redirect("/login")
  }

  const initial = session?.user?.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        items={NAV_ITEMS}
        roleLabel={role === "ADMIN" ? "Admin" : role === "BENDAHARA" ? "Bendahara" : "Pengurus"}
        userEmail={session?.user?.email ?? ""}
        userInitial={initial}
      />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex shrink-0 items-center justify-end gap-2 border-b bg-card px-6 py-3">
          <ThemeToggle />
          <NotifikasiBell role={session?.user?.role} />
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
