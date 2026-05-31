import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AppSidebar, type NavItem } from "@/components/app-sidebar"

const NAV_ITEMS: NavItem[] = [
  { href: "/pengurus", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/pengurus/anggota", label: "Anggota", icon: "Users" },
  { href: "/pengurus/simpanan", label: "Simpanan", icon: "PiggyBank" },
  { href: "/pengurus/pinjaman", label: "Pinjaman", icon: "HandCoins" },
  { href: "/pengurus/jurnal", label: "Akuntansi", icon: "BookOpen" },
  { href: "/pengurus/shu", label: "SHU", icon: "Scale" },
  { href: "/pengurus/tutup-buku", label: "Tutup Buku", icon: "FileText" },
  { href: "/pengurus/konfigurasi", label: "Pengaturan", icon: "Settings" },
]

export default async function PengurusLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "PENGURUS" && role !== "BENDAHARA") {
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
        roleLabel={role === "BENDAHARA" ? "Bendahara" : "Pengurus"}
        userEmail={session?.user?.email ?? ""}
        userInitial={initial}
      />
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  )
}
