/**
 * @file src/app/anggota/shu/page.tsx
 * @description Halaman portal mandiri anggota untuk modul: page.
 */

import { getSHUAnggota } from "@/actions/shu"
import { SHUAnggotaCard } from "@/components/shu/shu-anggota"
import { auth } from "@/lib/auth"

export default async function AnggotaSHUPage() {
  const session = await auth()
  const data = await getSHUAnggota(session?.user?.anggotaId ?? undefined)
  return <SHUAnggotaCard data={data} />
}
