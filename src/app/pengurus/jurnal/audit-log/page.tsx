import { getAuditLogs } from "@/actions/audit-log"
import { AuditLogTable } from "@/components/jurnal/audit-log-table"

type Props = {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string }>
}

export default async function AuditLogPage({ searchParams }: Props) {
  const { entityType, action, page } = await searchParams

  const result = await getAuditLogs({
    entityType,
    action,
    page: page ? Number(page) : 1,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
      </div>

      <AuditLogTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        entityType={entityType ?? "SEMUA"}
        action={action ?? "SEMUA"}
      />
    </div>
  )
}
