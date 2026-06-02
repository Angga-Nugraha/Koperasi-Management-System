import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSimpananAnggota, getMutasiAnggota, getTagihanWajibAnggota, ensureTagihanWajibAnggota } from "@/actions/simpanan"
import { AnggotaSimpananView } from "@/components/simpanan/anggota-simpanan-view"

type Props = { searchParams: Promise<{ page?: string; pageSize?: string }> }

export default async function AnggotaSimpananPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const { page, pageSize: ps } = await searchParams
  const pageSize = Number(ps) || 20
  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  await ensureTagihanWajibAnggota(anggotaId)
  const [simpanan, mutasi, tagihan] = await Promise.all([
    getSimpananAnggota(anggotaId),
    getMutasiAnggota(anggotaId, { page: Number(page) || 1, pageSize }),
    getTagihanWajibAnggota(anggotaId),
  ])

  return <AnggotaSimpananView simpanan={simpanan} mutasi={mutasi} tagihan={tagihan} pageSize={pageSize} />
}
