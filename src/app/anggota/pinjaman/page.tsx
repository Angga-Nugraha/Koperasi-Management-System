import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPinjamanAnggota, getPlafonAnggota } from "@/actions/pinjaman"
import { AnggotaPinjamanView } from "@/components/pinjaman/anggota-pinjaman-view"

export default async function AnggotaPinjamanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  const [pinjaman, plafon] = await Promise.all([
    getPinjamanAnggota(anggotaId),
    getPlafonAnggota(anggotaId),
  ])

  return <AnggotaPinjamanView pinjaman={pinjaman} plafon={plafon} />
}
