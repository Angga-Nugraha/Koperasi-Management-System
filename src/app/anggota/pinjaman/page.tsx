/**
 * @file src/app/anggota/pinjaman/page.tsx
 * @description Halaman portal mandiri anggota untuk modul: page.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPinjamanAnggota, getPlafonAnggota } from "@/actions/pinjaman"
import { AnggotaPinjamanView } from "@/components/pinjaman/anggota-pinjaman-view"
import { prisma } from "@/lib/prisma"

export default async function AnggotaPinjamanPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ANGGOTA") redirect("/login")

  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    return <p className="text-muted-foreground">Akun ini tidak terhubung ke data anggota.</p>
  }

  const [pinjaman, plafon, pendingPaymentsRaw] = await Promise.all([
    getPinjamanAnggota(anggotaId),
    getPlafonAnggota(anggotaId),
    prisma.transaksiOnline.findMany({
      where: {
        anggotaId,
        tipe: "ANGSURAN",
        status: "PENDING",
        expiredAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const pendingPayments = pendingPaymentsRaw.map((p) => ({
    id: p.id,
    orderId: p.orderId,
    tipe: p.tipe,
    relatedId: p.relatedId,
    nominal: Number(p.nominal),
    status: p.status,
    snapToken: p.snapToken,
    snapUrl: p.snapUrl,
    expiredAt: p.expiredAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <AnggotaPinjamanView pinjaman={pinjaman} plafon={plafon} pendingPayments={pendingPayments} />
  )
}
