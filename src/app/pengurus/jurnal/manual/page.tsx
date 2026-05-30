import { getAkunList } from "@/actions/jurnal"
import { JurnalManualForm } from "@/components/jurnal/jurnal-manual-form"

export default async function JurnalManualPage() {
  const akunList = await getAkunList()
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Jurnal Manual</h1>
      <JurnalManualForm akunList={akunList} />
    </div>
  )
}
