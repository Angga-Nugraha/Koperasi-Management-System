import { getSHUAnggota } from "@/actions/shu"
import { SHUAnggotaCard } from "@/components/shu/shu-anggota"
import { auth } from "@/lib/auth"

export default async function AnggotaSHUPage() {
  const session = await auth()
  const data = await getSHUAnggota(session?.user?.anggotaId ?? undefined)
  return <SHUAnggotaCard data={data} />
}
