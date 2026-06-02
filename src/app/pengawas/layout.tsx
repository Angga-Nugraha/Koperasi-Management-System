import { redirect } from "next/navigation"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"
import { auth } from "@/lib/auth"
import { NotifikasiBell } from "@/components/notifikasi-bell"

const NAV_ITEMS: NavItem[] = [
  { href: "/pengawas", label: "Dashboard", icon: "LayoutDashboard" },
  {
    href: "/pengawas/laporan",
    label: "Laporan",
    icon: "FileText",
    children: [
      { href: "/pengawas/laporan/neraca", label: "Neraca", icon: "FileChartColumn" },
      { href: "/pengawas/laporan/laba-rugi", label: "Laba / Rugi", icon: "FileChartLine" },
      { href: "/pengawas/laporan/arus-kas", label: "Arus Kas", icon: "ArrowRightLeft" },
      { href: "/pengawas/laporan/neraca-saldo", label: "Neraca Saldo", icon: "FileSpreadsheet" },
      { href: "/pengawas/laporan/buku-besar", label: "Buku Besar", icon: "BookText" },
    ],
  },
  { href: "/pengawas/laporan/audit-log", label: "Audit Log", icon: "ScrollText" },
]

export default async function PengawasLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "PENGAWAS") {
    redirect("/login")
  }

  const initial = session?.user?.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        items={NAV_ITEMS}
        roleLabel="Pengawas"
        userEmail={session?.user?.email ?? ""}
        userInitial={initial}
      />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex shrink-0 items-center justify-end border-b bg-card px-6 py-3">
          <NotifikasiBell />
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
