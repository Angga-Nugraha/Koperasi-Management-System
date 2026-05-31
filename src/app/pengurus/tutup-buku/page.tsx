import { getSHUTutupBukuList } from "@/actions/tutup-buku"
import { TutupBukuPage } from "@/components/tutup-buku/tutup-buku-page"

export default async function Page() {
  const data = await getSHUTutupBukuList()
  return <TutupBukuPage data={data} />
}
