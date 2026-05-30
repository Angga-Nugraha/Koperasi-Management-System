"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { setujuiSHU, getSHUByTahun } from "@/actions/shu"
import { CheckCircle2, Clock, ArrowLeft, Download } from "lucide-react"

type SHUDetail = NonNullable<Awaited<ReturnType<typeof getSHUByTahun>>>

export function SHUDetailCard({ data }: { data: SHUDetail }) {
  const router = useRouter()
  const [approving, setApproving] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")

  async function handleApprove() {
    setApproving(true)
    setError("")
    try {
      await setujuiSHU(data.tahun)
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/pengurus/shu")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">SHU Tahun {data.tahun}</h1>
            <p className="text-sm text-muted-foreground">
              Status: <Badge variant={data.status === "FINAL" ? "default" : "secondary"}>
                {data.status === "FINAL" ? <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> FINAL</span> : <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> DRAFT</span>}
              </Badge>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.status === "DRAFT" && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="default">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Setujui & Finalkan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Setujui SHU {data.tahun}</DialogTitle>
                  <DialogDescription>
                    Setelah disetujui, status akan menjadi FINAL dan jurnal penutup akan dibuat. Tindakan ini tidak dapat dibatalkan.
                  </DialogDescription>
                </DialogHeader>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                  <Button onClick={handleApprove} disabled={approving}>
                    {approving ? "Memproses..." : "Setujui"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" onClick={async () => {
            const { exportSHUExcel } = await import("@/actions/shu")
            const buffer = await exportSHUExcel(data.tahun)
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
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
              <p className="text-2xl font-bold text-primary">Rp {data.totalSHU.toLocaleString("id-ID")}</p>
            </div>
            {data.alokasi.map((a) => (
              <div key={a.pos} className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">{posLabel(a.pos)} ({a.persentase}%)</p>
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
                    <TableCell className="text-right font-medium">Rp {a.total.toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function posLabel(pos: string) {
  const map: Record<string, string> = {
    JM: "Jasa Modal",
    JU: "Jasa Usaha",
    CAD: "Cadangan",
    PENGURUS: "Pengurus",
    PENGAWAS: "Pengawas",
    SOSIAL: "Pendidikan & Sosial",
  }
  return map[pos] ?? pos
}
