import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSimpananAnggota, getMutasiAnggota } from "@/actions/simpanan"
import { AnggotaSimpananView } from "@/components/simpanan/anggota-simpanan-view"

type Props = { searchParams: Promise<{ page?: string }> }

export default async function AnggotaSimpananPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const { page } = await searchParams
  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  const simpanan = await getSimpananAnggota(anggotaId)
  const mutasi = await getMutasiAnggota(anggotaId, { page: Number(page) || 1 })

  return <AnggotaSimpananView simpanan={simpanan} mutasi={mutasi} />
}
