"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, CheckCircle2, XCircle, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { importAnggotaFromCsv, type ImportRowResult } from "@/actions/import-anggota"
import Link from "next/link"

export function ImportAnggotaForm() {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<ImportRowResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)

  async function handleSubmit() {
    setConfirm(null)
    if (!file) return

    setLoading(true)
    setError("")
    setResults(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await importAnggotaFromCsv(formData)
      setResults(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengimport data")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setConfirm({ title: "Import Anggota", desc: `Import data dari "${file.name}"? Proses tidak dapat dibatalkan.`, onConfirm: handleSubmit })
  }

  const successCount = results?.filter((r) => r.success).length ?? 0
  const errorCount = results?.filter((r) => !r.success).length ?? 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload File CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md bg-muted p-4 text-sm">
            <p className="mb-2 font-medium">Format CSV yang didukung:</p>
            <p className="text-muted-foreground">
              Kolom: <code>nik</code>, <code>nama</code>, <code>alamat</code>, <code>pekerjaan</code> (opsional),{" "}
              <code>penghasilan</code> (opsional), <code>tglMasuk</code>
            </p>
            <p className="mt-1 text-muted-foreground">
              Contoh: <code>3201010203040506,John Doe,Jl. Merdeka No. 1,Karyawan,5000000,2024-01-15</code>
            </p>
          </div>

          <form onSubmit={handleSubmitClick} className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                id="file"
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Button type="submit" disabled={!file || loading}>
                <Upload className="mr-2 h-4 w-4" />
                {loading ? "Memproses..." : "Import"}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hasil Import</CardTitle>
              <div className="flex gap-2">
                <Badge variant="default" className="text-sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {successCount} Berhasil
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    <XCircle className="mr-1 h-3 w-3" />
                    {errorCount} Gagal
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Baris</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r.row}>
                    <TableCell>{r.row}</TableCell>
                    <TableCell className="font-mono text-sm">{r.nik}</TableCell>
                    <TableCell>{r.nama}</TableCell>
                    <TableCell>
                      {r.success ? (
                        <Badge variant="default">Berhasil</Badge>
                      ) : (
                        <Badge variant="destructive">Gagal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.success ? "Berhasil diimport" : r.error}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/pengurus/anggota">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Link>
              </Button>
              {successCount > 0 && (
                <Button asChild>
                  <Link href="/pengurus/anggota">
                    Lihat Daftar Anggota
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      <AlertDialog open={!!confirm} onOpenChange={(open) => { if (!open) setConfirm(null) }}>
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
