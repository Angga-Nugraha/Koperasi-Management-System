import { getSHUByTahun } from "@/actions/shu"
import { SHUDetailCard } from "@/components/shu/shu-detail"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ tahun: string }>; searchParams: Promise<{ page?: string }> }

export default async function SHUTahunPage({ params, searchParams }: Props) {
  const { tahun } = await params
  const { page } = await searchParams
  const data = await getSHUByTahun(Number(tahun), Number(page) || 1)
  if (!data) notFound()
  return <SHUDetailCard data={data} />
}
