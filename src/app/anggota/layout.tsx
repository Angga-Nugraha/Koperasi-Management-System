import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LayoutDashboard, PiggyBank, HandCoins, Scale } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"

const NAV_ITEMS: NavItem[] = [
  { href: "/anggota", label: "Dashboard", icon: LayoutDashboard },
  { href: "/anggota/simpanan", label: "Simpanan Saya", icon: PiggyBank },
  { href: "/anggota/pinjaman", label: "Pinjaman Saya", icon: HandCoins },
  { href: "/anggota/shu", label: "SHU Saya", icon: Scale },
]

export default async function AnggotaLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "ANGGOTA") {
    redirect("/login")
  }

  const initial = session?.user?.email?.charAt(0).toUpperCase() ?? "U"
  const generalInfo = await prisma.generalInfo.findFirst()
  const namaKoperasi = generalInfo?.namaKoperasi ?? "Simko"

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        items={NAV_ITEMS}
        namaKoperasi={namaKoperasi}
        roleLabel="Anggota"
        userEmail={session?.user?.email ?? ""}
        userInitial={initial}
      />
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  )
}
