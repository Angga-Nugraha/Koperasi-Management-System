import { getJurnalList } from "@/actions/jurnal"
import { JurnalTable } from "@/components/jurnal/jurnal-table"

type Props = {
  searchParams: Promise<{ search?: string; page?: string }>
}

export default async function JurnalPage({ searchParams }: Props) {
  const { search, page } = await searchParams

  const result = await getJurnalList({
    search,
    page: page ? Number(page) : 1,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Umum</h1>
          <p className="text-sm text-muted-foreground">Daftar seluruh jurnal dan laporan keuangan</p>
        </div>
      </div>

      <AkuntansiNav />

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <a
            href="/api/export/jurnal-excel"
            className="inline-flex items-center rounded-md bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700"
          >
            Export Excel
          </a>
          <a
            href="/api/export/jurnal-pdf"
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Export PDF
          </a>
        </div>
        <a
          href="/pengurus/jurnal/manual"
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + Jurnal Manual
        </a>
      </div>

      <JurnalTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        search={search}
      />
    </div>
  )
}

function AkuntansiNav() {
  const links = [
    { href: "/pengurus/jurnal", label: "Jurnal Umum" },
    { href: "/pengurus/jurnal/buku-besar", label: "Buku Besar" },
    { href: "/pengurus/jurnal/neraca-saldo", label: "Neraca Saldo" },
    { href: "/pengurus/jurnal/neraca", label: "Neraca" },
    { href: "/pengurus/jurnal/laba-rugi", label: "Laba / Rugi" },
    { href: "/pengurus/jurnal/arus-kas", label: "Arus Kas" },
    { href: "/pengurus/jurnal/shu", label: "SHU" },
    { href: "/pengurus/jurnal/audit-log", label: "Audit Log" },
  ]

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {l.label}
        </a>
      ))}
    </nav>
  )
}
