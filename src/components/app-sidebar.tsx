"use client"

/**
 * @file src/components/app-sidebar.tsx
 * @description Komponen presentasional / interaktif: app-sidebar.
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  BookOpen,
  BookText,
  FileSpreadsheet,
  FileChartColumn,
  FileChartLine,
  ArrowRightLeft,
  Settings,
  Scale,
  FileText,
  UserCog,
  ScrollText,
  GitBranch,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  PiggyBank,
  HandCoins,
  BookOpen,
  BookText,
  FileSpreadsheet,
  FileChartColumn,
  FileChartLine,
  ArrowRightLeft,
  Settings,
  Scale,
  FileText,
  UserCog,
  ScrollText,
  GitBranch,
}

export type NavItem = {
  href: string
  label: string
  icon: string
  children?: NavItem[]
}

type Props = {
  items: NavItem[]
  roleLabel: string
  userEmail: string
  userInitial: string
}

const COLLAPSED_KEY = "sidebar-collapsed"

function NavLink({
  href,
  icon,
  label,
  collapsed,
  onNavigate,
}: {
  href: string
  icon: string
  label: string
  collapsed: boolean
  onNavigate: () => void
}) {
  const pathname = usePathname()
  const Icon = ICON_MAP[icon]
  const depth = href.split("/").filter(Boolean).length
  const isActive = depth <= 1
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/")

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        collapsed && "justify-center px-2",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className={cn("text-left", collapsed && "hidden")}>{label}</span>
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return link
}

function NavSubmenu({
  item,
  pathname,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  onNavigate?: () => void
}) {
  const [open, setOpen] = useState(
    pathname === item.href || pathname.startsWith(item.href + "/"),
  )
  const isActive = pathname.startsWith(item.href + "/")
  const ParentIcon = ICON_MAP[item.icon]

  const childrenLinks = item.children!.map((child) => {
    const ChildIcon = ICON_MAP[child.icon]
    const isChildActive = child.href === item.href
      ? pathname === child.href
      : pathname === child.href || pathname.startsWith(child.href + "/")
    return (
      <Link
        key={child.href}
        href={child.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors",
          isChildActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" />}
        {child.label}
      </Link>
    )
  })

  if (collapsed) {
    return (
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors justify-center px-2",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                {ParentIcon && <ParentIcon className="h-4 w-4 shrink-0" />}
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
        <PopoverContent side="right" align="start" className="w-56 p-2 bg-card border shadow-md">
          <div className="mb-2 px-3 py-1.5 text-sm font-semibold text-foreground">
            {item.label}
          </div>
          <Separator className="mb-2" />
          <div className="space-y-1">{childrenLinks}</div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        aria-expanded={open}
      >
        {ParentIcon && <ParentIcon className="h-4 w-4 shrink-0" />}
        <span className="flex-1 text-left">{item.label}</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l pl-2">{childrenLinks}</div>
      )}
    </div>
  )
}

export function AppSidebar({ items, roleLabel, userEmail, userInitial }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(COLLAPSED_KEY) === "true"
  })

  useEffect(() => {
    fetch("/api/general-info")
      .then((r) => r.json())
      .then((info) => { if (info?.logo) setLogoUrl(info.logo) })
      .catch(() => {})
  }, [])

  const logo = logoUrl || "/logo.png"

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem(COLLAPSED_KEY, String(next))
      return next
    })
  }

  const navLinks = items.map((item) => {
    if (item.children) {
      return (
        <NavSubmenu
          key={item.href}
          item={item}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={() => setMobileOpen(false)}
        />
      )
    }

    return (
      <NavLink
        key={item.href}
        href={item.href}
        icon={item.icon}
        label={item.label}
        collapsed={collapsed}
        onNavigate={() => setMobileOpen(false)}
      />
    )
  })

  function renderUserSection(compact: boolean) {
    return (
      <>
        <Separator />
        <div className={cn(compact ? "flex flex-col items-center gap-2 p-2" : "p-4")}>
          <div className={cn("flex items-center gap-3", compact && "flex-col")}>
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div className={cn("flex-1 truncate text-sm", compact && "hidden")}>
              <p className="font-medium">{userEmail}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size={compact ? "icon" : "sm"}
            className={cn(
              "text-muted-foreground",
              compact ? "mt-1 h-8 w-8" : "mt-2 w-full justify-start",
            )}
            onClick={() => signOut({ redirectTo: "/login" })}
          >
            <LogOut className={cn("h-4 w-4", compact ? "" : "mr-2")} />
            <span className={cn(compact && "hidden")}>Keluar</span>
          </Button>
        </div>
      </>
    )
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={cn("relative flex items-center border-b", collapsed ? "h-14 justify-center" : "h-16 justify-center px-6")}>
        <Link href={items[0]?.href ?? "/"} className={cn(collapsed && "flex items-center justify-center")}>
          <img
            src={logo}
            alt="Logo"
            className={cn(
              "rounded-lg object-contain transition-all",
              collapsed ? "h-7 w-7" : "w-20 p-1",
            )}
          />
        </Link>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border bg-card text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="h-3 w-3" />
          </Button>
        )}
      </div>
      <nav className={cn("flex-1 space-y-1", collapsed ? "p-2" : "p-4")}>
        {navLinks}
      </nav>
      {renderUserSection(collapsed)}
    </div>
  )

  const collapsedSidebarContent = (
    <div className="flex h-full flex-col">
      <div className="relative flex h-14 items-center justify-center border-b">
        <Link href={items[0]?.href ?? "/"} className="flex items-center justify-center">
          <img src={logo} alt="Logo" className="h-7 w-7 rounded-lg object-contain" />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 rounded-full border bg-card text-muted-foreground hover:text-foreground"
        >
          <PanelLeftOpen className="h-3 w-3" />
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">{navLinks}</nav>
      {renderUserSection(true)}
    </div>
  )

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "hidden border-r bg-card md:flex md:flex-col transition-all duration-300 relative",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {collapsed ? collapsedSidebarContent : sidebarContent}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed left-4 top-3 z-50 md:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center justify-center border-b px-6">
              <Link href={items[0]?.href ?? "/"}>
                <img src={logo} alt="Logo" className="w-20 rounded-lg object-contain p-1" />
              </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {items.map((item) => {
                if (item.children) {
                  return <NavSubmenu key={item.href} item={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} collapsed={false} />
                }
                return <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} collapsed={false} onNavigate={() => setMobileOpen(false)} />
              })}
            </nav>
            {renderUserSection(false)}
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
