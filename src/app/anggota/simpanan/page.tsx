import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSimpananAnggota, getMutasiAnggota } from "@/actions/simpanan"
import { AnggotaSimpananView } from "@/components/simpanan/anggota-simpanan-view"

export default async function AnggotaSimpananPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  const simpanan = await getSimpananAnggota(anggotaId)
  const mutasi = await getMutasiAnggota(anggotaId, {})

  return <AnggotaSimpananView simpanan={simpanan} mutasi={mutasi} />
}
