/**
 * @file src/app/pengurus/konfigurasi/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import {
  getKonfigList,
  getAkunList,
  getGeneralInfo,
  getJenisPinjamanList,
  getJenisSimpananList,
} from "@/actions/konfigurasi"
import { KonfigurasiPage } from "@/components/konfigurasi/konfigurasi-page"

export default async function PengaturanPage() {
  const [konfig, akun, generalInfo, jenisPinjaman, jenisSimpanan] = await Promise.all([
    getKonfigList(),
    getAkunList(),
    getGeneralInfo(),
    getJenisPinjamanList(),
    getJenisSimpananList(),
  ])

  return (
    <KonfigurasiPage
      konfig={konfig}
      akun={akun}
      generalInfo={generalInfo}
      jenisPinjaman={jenisPinjaman}
      jenisSimpanan={jenisSimpanan}
    />
  )
}
