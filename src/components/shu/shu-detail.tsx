"use client"

/**
 * @file src/components/shu/shu-detail.tsx
 * @description Komponen presentasional / interaktif: shu-detail.
 */

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { hapusSHU, generateSHU, getSHUByTahun } from "@/actions/shu"
import { FileText, ArrowLeft, Download, Trash2, RefreshCw } from "lucide-react"

type SHUDetail = NonNullable<Awaited<ReturnType<typeof getSHUByTahun>>>

export function SHUDetailCard({ data }: { data: SHUDetail }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pageSize = Number(searchParams.get("pageSize")) || 20
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState("")

  async function handleDelete() {
    setDeleting(true)
    setDeleteError("")
    try {
      await hapusSHU(data.tahun)
      router.push("/pengurus/shu")
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    setRegenError("")
    try {
      await hapusSHU(data.tahun)
      await generateSHU(data.tahun)
      router.refresh()
    } catch (err) {
      setRegenError((err as Error).message)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pengurus/shu")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SHU Tahun {data.tahun}</h1>
            <div className="text-sm text-muted-foreground">
              Status:{" "}
              <Badge variant={data.status === "FINAL" ? "default" : "secondary"}>
                {data.status === "FINAL" ? (
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Closed</span>
                ) : (
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Estimasi</span>
                )}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data.status === "DRAFT" && (
            <>
              <Button variant="outline" onClick={handleRegenerate} disabled={regenerating}>
                <RefreshCw className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
                {regenerating ? "Memproses..." : "Generate Ulang"}
              </Button>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hapus SHU {data.tahun}?</DialogTitle>
                    <DialogDescription>
                      SHU estimasi akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                  </DialogHeader>
                  {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                      {deleting ? "Menghapus..." : "Hapus"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
          {regenError && <p className="text-sm text-destructive">{regenError}</p>}
          <Button variant="outline" onClick={async () => {
            const { exportSHUExcel } = await import("@/actions/shu")
            const buf = await exportSHUExcel(data.tahun)
            const blob = new Blob([new Uint8Array(buf)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `shu-${data.tahun}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
          }}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Ringkasan Alokasi */}
      <Card>
        <CardHeader>
          <CardTitle>Alokasi SHU</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Total SHU</p>
              <p className={`text-2xl font-bold ${data.totalSHU >= 0 ? "text-green-600" : "text-red-600"}`}>Rp {data.totalSHU.toLocaleString("id-ID")}</p>
            </div>
              {data.alokasi.map((a) => (
              <div key={a.pos} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{a.indikatorNama} ({a.persentase}%)</p>
                <p className="text-xl font-semibold">Rp {a.nominal.toLocaleString("id-ID")}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabel SHU per Anggota */}
      <Card>
        <CardHeader>
          <CardTitle>SHU per Anggota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No Anggota</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Jasa Modal</TableHead>
                <TableHead className="text-right">Jasa Usaha</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.shuAnggota.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Belum ada data perhitungan SHU per anggota
                  </TableCell>
                </TableRow>
              ) : (
                data.shuAnggota.map((a) => (
                  <TableRow key={a.anggotaId}>
                    <TableCell>{a.noAnggota}</TableCell>
                    <TableCell>{a.nama}</TableCell>
                    <TableCell className="text-right">Rp {a.jasaModal.toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-right">Rp {a.jasaUsaha.toLocaleString("id-ID")}</TableCell>
                    <TableCell className={`text-right font-medium ${a.total >= 0 ? "text-green-600" : "text-red-600"}`}>Rp {a.total.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
          </div>

          <DataTablePagination
            page={data.page ?? 1}
            totalPages={data.totalPages ?? 0}
            total={data.shuAnggota.length}
            pageSize={pageSize}
            onPageChange={(p) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set("page", String(p))
              if (pageSize !== 20) params.set("pageSize", String(pageSize))
              router.push(`/pengurus/shu/${data.tahun}?${params.toString()}`)
            }}
            onPageSizeChange={(size) => {
              const params = new URLSearchParams(searchParams.toString())
              if (size !== 20) params.set("pageSize", String(size))
              else params.delete("pageSize")
              params.delete("page")
              router.push(`/pengurus/shu/${data.tahun}?${params.toString()}`)
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
