import { PageHeader } from "@/components/ui/page-header"
import { getKepengurusanList, getAnggotaListForSelect } from "@/actions/kepengurusan"
import { assertRole } from "@/lib/auth"
import { StrukturTable } from "@/components/kepengurusan/struktur-table"

export default async function StrukturPage() {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const [data, anggotaList] = await Promise.all([getKepengurusanList(), getAnggotaListForSelect()])

  return (
    <div className="space-y-6">
      <PageHeader title="Struktur Organisasi" description="Kelola pengurus dan pengawas koperasi" />

      <StrukturTable data={data} anggotaList={anggotaList} />
    </div>
  )
}
