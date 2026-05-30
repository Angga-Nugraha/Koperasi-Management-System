import { getJurnalById } from "@/actions/jurnal"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ jurnalId: string }>
}

export default async function JurnalDetailPage({ params }: Props) {
  const { jurnalId } = await params
  const jurnal = await getJurnalById(jurnalId)
  if (!jurnal) notFound()

  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/pengurus/jurnal" className="text-sm text-primary hover:underline">
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Detail Jurnal</h1>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm text-muted-foreground">No Jurnal</span>
            <p className="font-mono font-medium">{jurnal.noJurnal}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Tanggal</span>
            <p className="font-medium">
              {new Date(jurnal.tanggal).toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <span className="text-sm text-muted-foreground">Keterangan</span>
            <p className="font-medium">{jurnal.keterangan}</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Kode Akun</th>
              <th className="px-4 py-2 text-left font-medium">Nama Akun</th>
              <th className="px-4 py-2 text-right font-medium">Debit</th>
              <th className="px-4 py-2 text-right font-medium">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {jurnal.detail.map((d, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-2 font-mono text-xs">{d.akunKode}</td>
                <td className="px-4 py-2">{d.akunNama}</td>
                <td className="px-4 py-2 text-right">{d.debit > 0 ? fmt(d.debit) : "-"}</td>
                <td className="px-4 py-2 text-right">{d.kredit > 0 ? fmt(d.kredit) : "-"}</td>
              </tr>
            ))}
            <tr className="font-medium">
              <td colSpan={2} className="px-4 py-2 text-right">
                Total
              </td>
              <td className="px-4 py-2 text-right">{fmt(jurnal.totalDebit)}</td>
              <td className="px-4 py-2 text-right">{fmt(jurnal.totalKredit)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
