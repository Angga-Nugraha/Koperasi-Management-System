import { getKepengurusanList, getAnggotaListForSelect } from "@/actions/kepengurusan"
import { assertRole } from "@/lib/auth"
import { StrukturTable } from "@/components/kepengurusan/struktur-table"

export default async function StrukturPage() {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const [data, anggotaList] = await Promise.all([getKepengurusanList(), getAnggotaListForSelect()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Struktur Organisasi</h1>
        <p className="text-sm text-muted-foreground">Kelola pengurus dan pengawas koperasi</p>
      </div>

      <StrukturTable data={data} anggotaList={anggotaList} />
    </div>
  )
}
