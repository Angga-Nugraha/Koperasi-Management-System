import { redirect } from "next/navigation"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"
import { auth } from "@/lib/auth"
import { NotifikasiBell } from "@/components/notifikasi-bell"

const NAV_ITEMS: NavItem[] = [
  { href: "/anggota", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/anggota/simpanan", label: "Simpanan Saya", icon: "PiggyBank" },
  { href: "/anggota/pinjaman", label: "Pinjaman Saya", icon: "HandCoins" },
  { href: "/anggota/shu", label: "SHU Saya", icon: "Scale" },
]

export default async function AnggotaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ANGGOTA") {
    redirect("/login")
  }

  const initial = session?.user?.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        items={NAV_ITEMS}
        roleLabel="Anggota"
        userEmail={session?.user?.email ?? ""}
        userInitial={initial}
      />
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <header className="flex shrink-0 items-center justify-end border-b bg-card px-6 py-3">
          <NotifikasiBell role="ANGGOTA" />
        </header>
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  )
}
