"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatTanggal } from "@/lib/format"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type AuditItem = {
  id: string
  userId: string | null
  userEmail: string
  action: string
  entityType: string
  entityId: string | null
  detail: string
  ipAddress: string | null
  createdAt: string
}

type Props = {
  data: AuditItem[]
  total: number
  page: number
  totalPages: number
  entityType: string
  action: string
}

export function AuditLogTable({ data, total, page, totalPages, entityType, action }: Props) {
  const router = useRouter()
  const [entityTypeVal, setEntityTypeVal] = useState(entityType)
  const [actionVal, setActionVal] = useState(action)

  function filter() {
    const params = new URLSearchParams()
    if (entityTypeVal && entityTypeVal !== "SEMUA") params.set("entityType", entityTypeVal)
    if (actionVal && actionVal !== "SEMUA") params.set("action", actionVal)
    params.set("page", "1")
    router.push(`/pengurus/jurnal/audit-log?${params.toString()}`)
  }

  function goPage(p: number) {
    const params = new URLSearchParams()
    if (entityTypeVal && entityTypeVal !== "SEMUA") params.set("entityType", entityTypeVal)
    if (actionVal && actionVal !== "SEMUA") params.set("action", actionVal)
    params.set("page", String(p))
    router.push(`/pengurus/jurnal/audit-log?${params.toString()}`)
  }

  const entityTypes = ["SEMUA", "USER", "ANGGOTA", "SETORAN_SIMPANAN", "PENARIKAN_SIMPANAN", "PENUTUPAN_SIMPANAN", "PINJAMAN", "ANGSURAN", "JURNAL_MANUAL", "SHU"]
  const actions = ["SEMUA", "CREATE", "UPDATE", "DELETE", "APPROVE", "REJECT", "DISBURSE", "PAYMENT", "UPDATE_STATUS"]

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
        <div className="w-full lg:w-auto">
          <label className="mb-1 block text-xs text-muted-foreground">Tipe Entitas</label>
          <Select value={entityTypeVal} onValueChange={setEntityTypeVal}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full lg:w-auto">
          <label className="mb-1 block text-xs text-muted-foreground">Aksi</label>
          <Select value={actionVal} onValueChange={setActionVal}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {actions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={filter} className="w-full sm:w-auto">Filter</Button>
      </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Entitas</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Belum ada log
                </TableCell>
              </TableRow>
            )}
            {data.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-sm whitespace-nowrap">
                  {formatTanggal(l.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {l.userEmail}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{l.entityType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      l.action === "CREATE"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : l.action === "DELETE"
                          ? "bg-red-100 text-red-700 hover:bg-red-100"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                    }
                  >
                    {l.action}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground" title={l.entityId ?? ""}>
                  {l.entityId ?? "-"}
                </TableCell>
                <TableCell className="max-w-[250px] truncate text-xs text-muted-foreground" title={l.detail}>
                  {l.detail}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} log ditemukan</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goPage(page - 1)}
          >
            Sebelumnya
          </Button>
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goPage(page + 1)}
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  )
}
