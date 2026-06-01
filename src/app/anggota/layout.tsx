import { redirect } from "next/navigation"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"
import { auth } from "@/lib/auth"

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
      <main className="flex-1 overflow-auto bg-background p-6">{children}</main>
    </div>
  )
}
