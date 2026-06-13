/**
 * @file src/app/pengurus/jurnal/manual/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getAkunList } from "@/actions/jurnal"
import { JurnalManualForm } from "@/components/jurnal/jurnal-manual-form"

export default async function JurnalManualPage() {
  const akunList = await getAkunList()
  return (
    <div className="space-y-6">
      <PageHeader title="Jurnal Manual" />
      <JurnalManualForm akunList={akunList} />
    </div>
  )
}
