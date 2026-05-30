import { getKonfigList, getAkunList } from "@/actions/konfigurasi"
import { KonfigurasiPage } from "@/components/konfigurasi/konfigurasi-page"

export default async function PengaturanPage() {
  const [konfig, akun] = await Promise.all([
    getKonfigList(),
    getAkunList(),
  ])

  return <KonfigurasiPage konfig={konfig} akun={akun} />
}
