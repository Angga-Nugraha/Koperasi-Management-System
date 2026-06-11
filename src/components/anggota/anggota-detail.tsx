"use client"

/**
 * @file src/components/anggota/anggota-detail.tsx
 * @description Komponen presentasional / interaktif: anggota-detail.
 */

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { EditAnggotaSheet } from "./edit-anggota-sheet"
import { KartuAnggotaCard } from "./kartu-anggota-card"
import { ArrowLeft, Edit, Trash2, ShieldAlert, Eye, CreditCard } from "lucide-react"
import { formatTanggal } from "@/lib/format"

import Link from "next/link"

type UserInfo = {
  id: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
} | null

type AnggotaDetail = {
  id: string
  nik: string
  noAnggota: string
  nama: string
  noHp: string | null
  jenisKelamin: string | null
  alamat: string
  pekerjaan: string | null
  penghasilan: number | null
  foto: string | null
  ktp: string | null
  tglMasuk: string
  status: string
  createdAt: string
  user: UserInfo
  simpanan: { jenisKode: string; jenisNama: string; saldo: number }[]
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
  const [ktpPreviewOpen, setKtpPreviewOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [kartuOpen, setKartuOpen] = useState(false)
  const [confirm, setConfirm] = useState<{
    title: string
    desc: string
    onConfirm: () => void
  } | null>(null)

  async function handleStatusChange() {
    setConfirm(null)
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
    setConfirm(null)
    try {
      await deleteAnggota(anggota.id)
      router.replace("/pengurus/anggota")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus")
    }
  }

  const totalSimpanan = anggota.simpanan.reduce((s, x) => s + Number(x.saldo), 0)
  const totalPinjamanOutstanding = anggota.pinjaman
    .filter((p) => ["PENGAJUAN", "DISETUJUI", "DICAIRKAN"].includes(p.status))
    .reduce((s, p) => s + Number(p.sisaPinjaman), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="flex flex-wrap items-center gap-2">
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
                <Button
                  onClick={() =>
                    setConfirm({
                      title: "Ubah Status Anggota",
                      desc: `Ubah status ${anggota.nama} menjadi ${STATUS_MAP[newStatus] ?? newStatus}?`,
                      onConfirm: handleStatusChange,
                    })
                  }
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setEditSheetOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>

          <Button variant="outline" onClick={() => setKartuOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Kartu
          </Button>
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
                  {anggota.ktp && <img src={anggota.ktp} alt="KTP" className="w-full rounded-lg" />}
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
                  <p className="text-sm text-muted-foreground">Jenis Kelamin</p>
                  <p className="font-medium">
                    {anggota.jenisKelamin === "LAKI_LAKI"
                      ? "Laki-laki"
                      : anggota.jenisKelamin === "PEREMPUAN"
                        ? "Perempuan"
                        : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">No. HP</p>
                  <p className="font-medium">{anggota.noHp ?? "-"}</p>
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
                  <p className="font-medium">{formatTanggal(anggota.tglMasuk)}</p>
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

          {/* User Account */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>User Account</CardTitle>
            </CardHeader>
            <CardContent>
              {anggota.user ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{anggota.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role</p>
                      <Badge variant="secondary">{anggota.user.role}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={anggota.user.isActive ? "default" : "destructive"}>
                        {anggota.user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dibuat</p>
                      <p className="font-medium">{formatTanggal(anggota.user.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Anggota ini belum memiliki user account.
                </p>
              )}
            </CardContent>
          </Card>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="mt-6">
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Anggota
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    setConfirm({
                      title: "Hapus Anggota",
                      desc: `Yakin ingin menghapus ${anggota.nama}? Tindakan ini tidak dapat dikembalikan.`,
                      onConfirm: handleDelete,
                    })
                  }
                >
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="simpanan">
          <Card>
            <CardHeader>
              <CardTitle>Simpanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
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
                        <TableRow key={s.jenisKode}>
                          <TableCell className="font-medium">{s.jenisNama}</TableCell>
                          <TableCell className="text-right font-mono">
                            Rp {Number(s.saldo).toLocaleString("id-ID")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pinjaman">
          <Card>
            <CardHeader>
              <CardTitle>Pinjaman</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border">
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
                          DICAIRKAN: "Dicairkan",
                          LUNAS: "Lunas",
                          GAGAL: "Gagal",
                        }
                        const statusStyle: Record<string, string> = {
                          PENGAJUAN: "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-50/80",
                          DISETUJUI:
                            "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-50/80",
                          DITOLAK: "border-red-300 text-red-700 bg-red-50 hover:bg-red-50/80",
                          DICAIRKAN:
                            "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-50/80",
                          LUNAS: "border-green-300 text-green-700 bg-green-50 hover:bg-green-50/80",
                          GAGAL: "border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-50/80",
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
                              <Badge className={statusStyle[p.status] ?? ""}>
                                {statusLabel[p.status] ?? p.status}
                              </Badge>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditAnggotaSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} anggota={anggota} />

      <KartuAnggotaCard
        open={kartuOpen}
        onOpenChange={setKartuOpen}
        anggota={{
          noAnggota: anggota.noAnggota,
          nama: anggota.nama,
          nik: anggota.nik,
          alamat: anggota.alamat,
          pekerjaan: anggota.pekerjaan,
          tglMasuk: anggota.tglMasuk,
          foto: anggota.foto,
        }}
      />

      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirm?.onConfirm}>Lanjutkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
