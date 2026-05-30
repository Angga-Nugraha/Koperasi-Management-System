import { getKonfigAlokasi } from "@/actions/shu"
import { KonfigAlokasiForm } from "@/components/shu/konfig-alokasi-form"

export default async function KonfigurasiSHUPage() {
  const data = await getKonfigAlokasi()
  return <KonfigAlokasiForm data={data} />
}
