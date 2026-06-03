"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, CheckCircle2, XCircle, ArrowLeft, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { previewImportAnggota, commitImportAnggota, type PreviewRowResult, type CommitRowResult } from "@/actions/import-anggota"
import Link from "next/link"

export function ImportAnggotaForm() {
  const [file, setFile] = useState<File | null>(null)
  const [previewResults, setPreviewResults] = useState<PreviewRowResult[] | null>(null)
  const [commitResults, setCommitResults] = useState<CommitRowResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)

  async function handlePreview() {
    if (!file) return

    setLoading(true)
    setError("")
    setPreviewResults(null)
    setCommitResults(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await previewImportAnggota(formData)
      setPreviewResults(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses file")
    } finally {
      setLoading(false)
    }
  }

  async function handleCommit() {
    setConfirm(null)
    if (!previewResults) return

    const validRows = previewResults.filter((r) => r.isValid)
    if (validRows.length === 0) return

    setLoading(true)
    setError("")

    try {
      const res = await commitImportAnggota(
        validRows.map((r) => ({
          row: r.row,
          nik: r.nik,
          nama: r.nama,
          noHp: r.noHp,
          jenisKelamin: r.jenisKelamin,
          alamat: r.alamat,
          pekerjaan: r.pekerjaan,
          penghasilan: r.penghasilan,
          tglMasuk: r.tglMasuk,
        }))
      )
      setCommitResults(res)
      setPreviewResults(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengimport data")
    } finally {
      setLoading(false)
    }
  }

  function handleCommitClick() {
    const validCount = previewResults?.filter((r) => r.isValid).length ?? 0
    setConfirm({
      title: "Konfirmasi Import",
      desc: `Apakah Anda yakin ingin mengimport ${validCount} anggota yang valid ke database?`,
      onConfirm: handleCommit,
    })
  }

  const previewValidCount = previewResults?.filter((r) => r.isValid).length ?? 0
  const previewInvalidCount = previewResults?.filter((r) => !r.isValid).length ?? 0

  const commitSuccessCount = commitResults?.filter((r) => r.success).length ?? 0
  const commitErrorCount = commitResults?.filter((r) => !r.success).length ?? 0

  return (
    <div className="space-y-6">
      {!previewResults && !commitResults && (
        <Card>
          <CardHeader>
            <CardTitle>Upload File CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 rounded-md bg-muted p-4 text-sm">
              <p className="mb-2 font-medium">Format CSV yang didukung:</p>
              <p className="text-muted-foreground">
                Kolom: <code>nik</code>, <code>nama</code>, <code>noHp</code> (opsional), <code>jenisKelamin</code> (opsional), <code>alamat</code>, <code>pekerjaan</code> (opsional),{" "}
                <code>penghasilan</code> (opsional), <code>tglMasuk</code>
              </p>
              <p className="mt-1 text-muted-foreground">
                Contoh: <code>3201010203040506,John Doe,081234567890,Laki-laki,Jl. Merdeka No. 1,Karyawan,5000000,2024-01-15</code>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:text-primary-foreground hover:file:bg-primary/90"
                />
                <Button onClick={handlePreview} disabled={!file || loading}>
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? "Memproses..." : "Upload & Preview"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {previewResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Preview Data Anggota</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Review data sebelum disimpan ke database</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="default" className="text-sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {previewValidCount} Valid
                </Badge>
                {previewInvalidCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    <XCircle className="mr-1 h-3 w-3" />
                    {previewInvalidCount} Invalid / Gagal
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Baris</TableHead>
                    <TableHead>NIK</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>No HP</TableHead>
                    <TableHead>Jenis Kelamin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewResults.map((r) => (
                    <TableRow key={r.row} className={!r.isValid ? "bg-destructive/5" : undefined}>
                      <TableCell>{r.row}</TableCell>
                      <TableCell className="font-mono text-sm">{r.nik}</TableCell>
                      <TableCell>{r.nama}</TableCell>
                      <TableCell>{r.noHp || "-"}</TableCell>
                      <TableCell>
                        {r.jenisKelamin === "LAKI_LAKI"
                          ? "Laki-laki"
                          : r.jenisKelamin === "PEREMPUAN"
                          ? "Perempuan"
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {r.isValid ? (
                          <Badge variant="default">Valid</Badge>
                        ) : (
                          <Badge variant="destructive">Invalid</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.isValid ? "Siap diimport" : r.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setPreviewResults(null)} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Upload Ulang
              </Button>
              {previewValidCount > 0 && (
                <Button onClick={handleCommitClick} disabled={loading}>
                  <Send className="mr-2 h-4 w-4" />
                  {loading ? "Mengimport..." : `Import ${previewValidCount} Anggota`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {commitResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hasil Import Database</CardTitle>
              <div className="flex gap-2">
                <Badge variant="default" className="text-sm">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {commitSuccessCount} Berhasil
                </Badge>
                {commitErrorCount > 0 && (
                  <Badge variant="destructive" className="text-sm">
                    <XCircle className="mr-1 h-3 w-3" />
                    {commitErrorCount} Gagal
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
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
                  {commitResults.map((r) => (
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
                        {r.success ? "Tersimpan ke database" : r.error}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-between">
              <Button variant="outline" onClick={() => setCommitResults(null)}>
                Import File Lain
              </Button>
              <Button asChild>
                <Link href="/pengurus/anggota">
                  Lihat Daftar Anggota
                </Link>
              </Button>
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
