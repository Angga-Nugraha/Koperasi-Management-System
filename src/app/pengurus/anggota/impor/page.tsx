/**
 * @file src/app/pengurus/anggota/impor/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { ImportAnggotaForm } from "@/components/anggota/import-anggota-form"

export const metadata = {
  title: "Import Anggota",
}

export default function ImportAnggotaPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Import Anggota" description="Import data anggota dari file CSV" />
      <ImportAnggotaForm />
    </div>
  )
}
