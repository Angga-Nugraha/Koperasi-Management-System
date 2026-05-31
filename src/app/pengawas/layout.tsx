import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
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
  const generalInfo = await prisma.generalInfo.findFirst()
  const namaKoperasi = generalInfo?.namaKoperasi ?? "Simko"
  const logoKoperasi = generalInfo?.logo ?? null

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        items={NAV_ITEMS}
        namaKoperasi={namaKoperasi}
        logoKoperasi={logoKoperasi}
        roleLabel="Pengawas"
        userEmail={session?.user?.email ?? ""}
        userInitial={initial}
      />
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  )
}
