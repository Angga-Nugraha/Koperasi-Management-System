import { getPinjamanById } from "@/actions/pinjaman"
import { notFound } from "next/navigation"
import { PinjamanDetailClient } from "@/components/pinjaman/pinjaman-detail"

type Props = {
  params: Promise<{ pinjamanId: string }>
}

export default async function DetailPinjamanPage({ params }: Props) {
  const { pinjamanId } = await params
  const pinjaman = await getPinjamanById(pinjamanId)

  if (!pinjaman) notFound()

  return <PinjamanDetailClient pinjaman={pinjaman} />
}
