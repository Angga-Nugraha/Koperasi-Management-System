/**
 * @file src/app/pengurus/tutup-buku/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { getSHUTutupBukuList } from "@/actions/tutup-buku"
import { TutupBukuPage } from "@/components/tutup-buku/tutup-buku-page"

export default async function Page() {
  const data = await getSHUTutupBukuList()
  return <TutupBukuPage data={data} />
}
