"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateAnggotaStatus, deleteAnggota } from "@/actions/anggota"
import { ArrowLeft, Edit, Trash2, ShieldAlert, Download, Eye } from "lucide-react"
import Link from "next/link"

type AnggotaDetail = {
  id: string
  nik: string
  noAnggota: string
  nama: string
  alamat: string
  pekerjaan: string | null
  penghasilan: number | null
  foto: string | null
  ktp: string | null
  tglMasuk: string
  status: string
  createdAt: string
  simpanan: { jenis: string; saldo: number }[]
  pinjaman: {
    id: string
    jumlah: number
    status: string
    sisaPinjaman: number
    angsuran: { status: string }[]
  }[]
}

type Props = {
  anggota: AnggotaDetail
}

const STATUS_MAP: Record<string, string> = {
  AKTIF: "Aktif",
  NONAKTIF: "Nonaktif",
  KELUAR: "Keluar",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  AKTIF: "default",
  NONAKTIF: "secondary",
  KELUAR: "destructive",
}

export function AnggotaDetailClient({ anggota }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState(anggota.status)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const [ktpPreviewOpen, setKtpPreviewOpen] = useState(false)

  async function handleStatusChange() {
    try {
      await updateAnggotaStatus({
        id: anggota.id,
        status: newStatus as "AKTIF" | "NONAKTIF" | "KELUAR",
      })
      setStatusDialogOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status")
    }
  }

  async function handleDelete() {
    try {
      const result = await deleteAnggota(anggota.id)
      setDeleteMsg(result.message)
      setTimeout(() => router.push("/pengurus/anggota"), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const totalSimpanan = anggota.simpanan.reduce((s, x) => s + Number(x.saldo), 0)
  const totalPinjamanOutstanding = anggota.pinjaman
    .filter((p) => ["PENGAJUAN", "DISETUJUI", "DICAIKKAN"].includes(p.status))
    .reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/pengurus/anggota">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{anggota.nama}</h1>
              <Badge variant={STATUS_VARIANTS[anggota.status] ?? "secondary"}>
                {STATUS_MAP[anggota.status] ?? anggota.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{anggota.noAnggota}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <ShieldAlert className="mr-2 h-4 w-4" />
                Ubah Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ubah Status Anggota</DialogTitle>
                <DialogDescription>Status saat ini: {STATUS_MAP[anggota.status]}</DialogDescription>
              </DialogHeader>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NONAKTIF">Nonaktif</SelectItem>
                  <SelectItem value="KELUAR">Keluar</SelectItem>
                </SelectContent>
              </Select>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleStatusChange}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link href={`/pengurus/anggota/${anggota.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <a href={`/api/anggota/${anggota.id}/kartu`} target="_blank">
              <Download className="mr-2 h-4 w-4" />
              Kartu
            </a>
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus Anggota</DialogTitle>
                <DialogDescription>
                  Yakin ingin menghapus {anggota.nama}? Jika memiliki data transaksi, status akan
                  diubah menjadi KELUAR.
                </DialogDescription>
              </DialogHeader>
              {deleteMsg && <p className="text-sm text-green-600">{deleteMsg}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Batal
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Ringkasan Kartu */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Simpanan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Rp {totalSimpanan.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pinjaman Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              Rp {totalPinjamanOutstanding.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pinjaman</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{anggota.pinjaman.length}x</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profil">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="simpanan">Simpanan</TabsTrigger>
          <TabsTrigger value="pinjaman">Pinjaman</TabsTrigger>
        </TabsList>

        <TabsContent value="profil">
          <Card>
            <CardHeader>
              <CardTitle>Data Profil</CardTitle>
            </CardHeader>
            <CardContent>
              {(anggota.foto || anggota.ktp) && (
                <div className="mb-6 flex gap-6">
                  {anggota.foto && (
                    <div>
                      <p className="mb-2 text-sm text-muted-foreground">Foto</p>
                      <img
                        src={anggota.foto}
                        alt="Foto anggota"
                        className="h-32 w-24 rounded-lg border object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">KTP</p>
                  {anggota.ktp ? (
                    <div className="flex items-center gap-3">
                      <Badge variant="default">Sudah diupload</Badge>
                      <Button variant="outline" size="sm" onClick={() => setKtpPreviewOpen(true)}>
                        <Eye className="mr-1 h-3 w-3" />
                        Lihat KTP
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary">Belum diupload</Badge>
                  )}
                </div>
              </div>
              <Dialog open={ktpPreviewOpen} onOpenChange={setKtpPreviewOpen}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>KTP - {anggota.nama}</DialogTitle>
                  </DialogHeader>
                  {anggota.ktp && (
                    <img src={anggota.ktp} alt="KTP" className="w-full rounded-lg" />
                  )}
                </DialogContent>
              </Dialog>
              <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">NIK</p>
                <p className="font-medium">{anggota.nik}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">No Anggota</p>
                <p className="font-medium">{anggota.noAnggota}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{anggota.nama}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{anggota.alamat}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pekerjaan</p>
                <p className="font-medium">{anggota.pekerjaan ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Penghasilan</p>
                <p className="font-medium">
                  {anggota.penghasilan
                    ? `Rp ${Number(anggota.penghasilan).toLocaleString("id-ID")}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Masuk</p>
                <p className="font-medium">
                  {new Date(anggota.tglMasuk).toLocaleDateString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={STATUS_VARIANTS[anggota.status] ?? "secondary"}>
                  {STATUS_MAP[anggota.status] ?? anggota.status}
                </Badge>
              </div>
            </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simpanan">
          <Card>
            <CardHeader>
              <CardTitle>Simpanan</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.simpanan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        Belum ada simpanan
                      </TableCell>
                    </TableRow>
                  ) : (
                    anggota.simpanan.map((s) => (
                      <TableRow key={s.jenis}>
                        <TableCell>{s.jenis}</TableCell>
                        <TableCell className="text-right font-mono">
                          Rp {Number(s.saldo).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pinjaman">
          <Card>
            <CardHeader>
              <CardTitle>Pinjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Angsuran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.pinjaman.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada pinjaman
                      </TableCell>
                    </TableRow>
                  ) : (
                    anggota.pinjaman.map((p) => {
                      const totalAngsuran = p.angsuran.length
                      const lunas = p.angsuran.filter((a) => a.status === "LUNAS").length
                      const statusLabel: Record<string, string> = {
                        PENGAJUAN: "Pengajuan",
                        DISETUJUI: "Disetujui",
                        DITOLAK: "Ditolak",
                        DICAIKKAN: "Dicairkan",
                        LUNAS: "Lunas",
                        GAGAL: "Gagal",
                      }
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">
                            Rp {Number(p.jumlah).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="font-mono">
                            Rp {Number(p.sisaPinjaman).toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{statusLabel[p.status] ?? p.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {lunas}/{totalAngsuran}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
