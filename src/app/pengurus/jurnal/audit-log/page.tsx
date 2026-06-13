/**
 * @file src/app/pengurus/jurnal/audit-log/page.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: page.
 */

import { PageHeader } from "@/components/ui/page-header"
import { getAuditLogs } from "@/actions/audit-log"
import { AuditLogTable } from "@/components/jurnal/audit-log-table"

type Props = {
  searchParams: Promise<{ entityType?: string; action?: string; page?: string; pageSize?: string }>
}

export default async function AuditLogPage({ searchParams }: Props) {
  const { entityType, action, page, pageSize: ps } = await searchParams
  const pageSize = Number(ps) || 20

  const result = await getAuditLogs({
    entityType,
    action,
    page: page ? Number(page) : 1,
    pageSize,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Audit Log" />
      </div>

      <AuditLogTable
        data={result.data}
        total={result.total}
        page={result.page}
        totalPages={result.totalPages}
        pageSize={pageSize}
        entityType={entityType ?? "SEMUA"}
        action={action ?? "SEMUA"}
      />
    </div>
  )
}
