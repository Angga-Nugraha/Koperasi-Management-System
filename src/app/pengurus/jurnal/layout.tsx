import { AkuntansiNav } from "@/components/jurnal/akuntansi-nav"

export default function JurnalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <AkuntansiNav />
      {children}
    </div>
  )
}
