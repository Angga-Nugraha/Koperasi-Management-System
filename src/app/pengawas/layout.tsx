import { redirect } from "next/navigation"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"
import { auth } from "@/lib/auth"

const NAV_ITEMS: NavItem[] = [
  { href: "/pengawas", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/pengawas/laporan", label: "Laporan", icon: "FileText" },
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
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  )
}
