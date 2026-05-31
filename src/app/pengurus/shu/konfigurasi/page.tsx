import { getIndikatorSHUList } from "@/actions/shu"
import { getAkunList } from "@/actions/konfigurasi"
import { KonfigAlokasiForm } from "@/components/shu/konfig-alokasi-form"

export default async function KonfigurasiSHUPage() {
  const [data, akunList] = await Promise.all([
    getIndikatorSHUList(),
    getAkunList(),
  ])
  return <KonfigAlokasiForm data={data} akunList={akunList} />
}
