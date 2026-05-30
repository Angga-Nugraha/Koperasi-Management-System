import { getSHUList } from "@/actions/shu"
import { SHUList } from "@/components/shu/shu-list"

export default async function SHUPage() {
  const data = await getSHUList()
  return <SHUList data={data} />
}
