import { auth } from "@/lib/auth"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  BookOpen,
  Settings,
  LogOut,
  Scale,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { signOut } from "@/lib/auth"
import { getKonfig, getString } from "@/lib/konfig"

const NAV_ITEMS = [
  { href: "/pengurus", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pengurus/anggota", label: "Anggota", icon: Users },
  { href: "/pengurus/simpanan", label: "Simpanan", icon: PiggyBank },
  { href: "/pengurus/pinjaman", label: "Pinjaman", icon: HandCoins },
  { href: "/pengurus/jurnal", label: "Akuntansi", icon: BookOpen },
  { href: "/pengurus/shu", label: "SHU", icon: Scale },
  { href: "/pengurus/konfigurasi", label: "Pengaturan", icon: Settings },
]

export default async function PengurusLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const role = session?.user?.role

  if (role !== "PENGURUS" && role !== "BENDAHARA") {
    redirect("/login")
  }

  const initial = session?.user?.email?.charAt(0).toUpperCase() ?? "U"
  const konfig = await getKonfig()
  const namaKoperasi = getString(konfig, "nama_koperasi", "Simko")

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <Link href="/pengurus" className="text-lg font-bold text-primary">
            {namaKoperasi}
          </Link>
          <span className="ml-2 rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
            {role === "BENDAHARA" ? "Bendahara" : "Pengurus"}
          </span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <div className="flex-1 truncate text-sm">
              <p className="font-medium">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">{role}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
            className="mt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
    </div>
  )
}
