import { ImportAnggotaForm } from "@/components/anggota/import-anggota-form"

export const metadata = {
  title: "Import Anggota",
}

export default function ImportAnggotaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Anggota</h1>
        <p className="text-sm text-muted-foreground">Import data anggota dari file CSV</p>
      </div>
      <ImportAnggotaForm />
    </div>
  )
}
