import { getSHUByTahun } from "@/actions/shu"
import { SHUDetailCard } from "@/components/shu/shu-detail"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ tahun: string }> }

export default async function SHUTahunPage({ params }: Props) {
  const { tahun } = await params
  const data = await getSHUByTahun(Number(tahun))
  if (!data) notFound()
  return <SHUDetailCard data={data} />
}
