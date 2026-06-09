"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Edit, Plus, Trash2 } from "lucide-react"
import { EditStrukturSheet } from "@/components/kepengurusan/edit-struktur-sheet"
import { TambahJabatanDialog } from "@/components/kepengurusan/tambah-jabatan-dialog"
import { hapusJabatan } from "@/actions/kepengurusan"
import type { StrukturItem } from "@/actions/kepengurusan"

type AnggotaOption = {
  id: string
  nama: string
  noAnggota: string
  nik: string
}

type Props = {
  data: StrukturItem[]
  anggotaList: AnggotaOption[]
}

export function StrukturTable({ data, anggotaList }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<StrukturItem | null>(null)
  const [tambahOpen, setTambahOpen] = useState(false)
  const [hapusConfirm, setHapusConfirm] = useState<StrukturItem | null>(null)
  const [hapusLoading, setHapusLoading] = useState(false)
  const [hapusError, setHapusError] = useState<string | null>(null)

  const pengurus = data.filter((d) => d.tipe === "PENGURUS")
  const pengawas = data.filter((d) => d.tipe === "PENGAWAS")

  function handleEdit(item: StrukturItem) {
    setEditItem(item)
    setEditOpen(true)
  }

  async function handleHapus() {
    if (!hapusConfirm) return
    setHapusLoading(true)
    setHapusError(null)
    try {
      await hapusJabatan(hapusConfirm.id)
      setHapusConfirm(null)
      router.refresh()
    } catch (err) {
      setHapusError(err instanceof Error ? err.message : "Gagal menghapus")
    } finally {
      setHapusLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Total {data.length} jabatan</p>
        <Button size="sm" onClick={() => setTambahOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Jabatan
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">
                Pengurus
              </Badge>
              <span className="text-sm font-normal text-muted-foreground">
                {pengurus.length} orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>No. Anggota</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengurus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada jabatan pengurus
                    </TableCell>
                  </TableRow>
                ) : (
                  pengurus.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.jabatan}</TableCell>
                      <TableCell>
                        {item.anggota ? (
                          item.anggota.nama
                        ) : (
                          <span className="text-muted-foreground italic">Kosong</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.anggota?.noAnggota ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setHapusConfirm(item)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                Pengawas
              </Badge>
              <span className="text-sm font-normal text-muted-foreground">
                {pengawas.length} orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>No. Anggota</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengawas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada jabatan pengawas
                    </TableCell>
                  </TableRow>
                ) : (
                  pengawas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.jabatan}</TableCell>
                      <TableCell>
                        {item.anggota ? (
                          item.anggota.nama
                        ) : (
                          <span className="text-muted-foreground italic">Kosong</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.anggota?.noAnggota ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setHapusConfirm(item)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {editItem && (
        <EditStrukturSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          item={{
            id: editItem.id,
            jabatan: editItem.jabatan,
            tipe: editItem.tipe,
            anggotaId: editItem.anggotaId,
          }}
          anggotaList={anggotaList}
        />
      )}

      <TambahJabatanDialog open={tambahOpen} onOpenChange={setTambahOpen} />

      <AlertDialog
        open={!!hapusConfirm}
        onOpenChange={(open) => {
          if (!open) setHapusConfirm(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jabatan</AlertDialogTitle>
            <AlertDialogDescription>
              {hapusError ? (
                <span className="text-destructive">{hapusError}</span>
              ) : (
                `Hapus jabatan "${hapusConfirm?.jabatan}" beserta penugasannya?`
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleHapus} disabled={hapusLoading}>
              {hapusLoading ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
