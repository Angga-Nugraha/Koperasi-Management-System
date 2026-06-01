"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  BookOpen,
  Settings,
  Scale,
  FileText,
  UserCog,
  LogOut,
  Menu,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  BookOpen,
  Settings,
  Scale,
  FileText,
  UserCog,
}

export type NavItem = {
  href: string
  label: string
  icon: string
}

type Props = {
  items: NavItem[]
  namaKoperasi: string
  logoKoperasi?: string | null
  roleLabel: string
  userEmail: string
  userInitial: string
}

export function AppSidebar({ items, namaKoperasi, logoKoperasi, roleLabel, userEmail, userInitial }: Props) {
  const pathname = usePathname()

  const navLinks = items.map((item) => {
    const Icon = ICON_MAP[item.icon]
    const depth = item.href.split("/").filter(Boolean).length
    const isActive = depth <= 1
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/")
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {item.label}
      </Link>
    )
  })

  const userSection = (
    <>
      <Separator />
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex-1 truncate text-sm">
            <p className="font-medium">{userEmail}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-muted-foreground"
          onClick={() => signOut({ redirectTo: "/login" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Keluar
        </Button>
      </div>
    </>
  )

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-3 border-b px-6">
        {logoKoperasi && (
          <img src={logoKoperasi} alt="Logo" className="h-8 w-8 rounded-lg object-contain" />
        )}
        <Link href={items[0]?.href ?? "/"} className="text-lg font-bold text-primary">
          {namaKoperasi}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">{navLinks}</nav>
      {userSection}
    </div>
  )

  return (
    <>
      <aside className="hidden w-64 border-r bg-card md:flex md:flex-col">
        {sidebarContent}
      </aside>

      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-3 z-50 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  )
}
