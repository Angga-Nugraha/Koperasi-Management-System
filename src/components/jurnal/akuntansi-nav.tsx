"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

const tabs = [
  { href: "/pengurus/jurnal", label: "Jurnal Umum" },
  { href: "/pengurus/jurnal/buku-besar", label: "Buku Besar" },
  { href: "/pengurus/jurnal/neraca-saldo", label: "Neraca Saldo" },
  { href: "/pengurus/jurnal/neraca", label: "Neraca" },
  { href: "/pengurus/jurnal/laba-rugi", label: "Laba / Rugi" },
  { href: "/pengurus/jurnal/arus-kas", label: "Arus Kas" },
  { href: "/pengurus/jurnal/audit-log", label: "Audit Log" },
]

export function AkuntansiNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {tabs.map((t) => {
        const isActive = t.href === "/pengurus/jurnal"
          ? pathname === "/pengurus/jurnal"
          : pathname.startsWith(t.href)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
