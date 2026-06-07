/**
 * @file src/app/anggota/simpanan/page.tsx
 * @description Halaman portal mandiri anggota untuk modul: page.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getSimpananAnggota, getMutasiAnggota, getTagihanWajibAnggota } from "@/actions/simpanan"
import { AnggotaSimpananView } from "@/components/simpanan/anggota-simpanan-view"
import { prisma } from "@/lib/prisma"

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

  const [simpanan, mutasi, tagihan, pendingPaymentsRaw] = await Promise.all([
    getSimpananAnggota(anggotaId),
    getMutasiAnggota(anggotaId, { page: Number(page) || 1, pageSize }),
    getTagihanWajibAnggota(anggotaId),
    prisma.transaksiOnline.findMany({
      where: {
        anggotaId,
        tipe: { in: ["TAGIHAN_WAJIB", "SIMPANAN_SUKARELA"] },
        status: "PENDING",
        expiredAt: { gte: new Date() }
      },
      orderBy: { createdAt: "desc" }
    })
  ])

  const pendingPayments = pendingPaymentsRaw.map(p => ({
    id: p.id,
    orderId: p.orderId,
    tipe: p.tipe,
    relatedId: p.relatedId,
    nominal: Number(p.nominal),
    status: p.status,
    snapToken: p.snapToken,
    snapUrl: p.snapUrl,
    expiredAt: p.expiredAt.toISOString(),
    createdAt: p.createdAt.toISOString()
  }))

  return (
    <AnggotaSimpananView 
      simpanan={simpanan} 
      mutasi={mutasi} 
      tagihan={tagihan} 
      pageSize={pageSize} 
      pendingPayments={pendingPayments}
    />
  )
}
