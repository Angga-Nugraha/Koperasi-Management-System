"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getKonfigList, updateKonfig, getAkunList, createAkun, toggleAkunActive,
  getGeneralInfo, updateGeneralInfo,
  getJenisPinjamanList, createJenisPinjaman, updateJenisPinjaman, deleteJenisPinjaman,
  getJenisSimpananList, createJenisSimpanan, updateJenisSimpanan, toggleJenisSimpananActive,
} from "@/actions/konfigurasi"
import { Save, Plus, Pencil, Trash2, Upload, X, Lock, Unlock } from "lucide-react"

type KonfigItem = Awaited<ReturnType<typeof getKonfigList>>[number]
type AkunItem = Awaited<ReturnType<typeof getAkunList>>[number]
type GeneralInfoItem = Awaited<ReturnType<typeof getGeneralInfo>>
type JenisPinjamanItem = Awaited<ReturnType<typeof getJenisPinjamanList>>[number]
type JenisSimpananItem = Awaited<ReturnType<typeof getJenisSimpananList>>[number]

const GROUP_LABELS: Record<string, string> = {
  plafon_max_saldo: "Maks. Plafon (× saldo)",
  denda_per_hari: "Denda per Hari (%)",
  grace_period: "Grace Period (hari)",
  tenor_min: "Tenor Min (bulan)",
  tenor_max: "Tenor Max (bulan)",
}

const GROUP_CATEGORY: Record<string, string> = {
  plafon_max_saldo: "pinjaman",
  denda_per_hari: "pinjaman",
  grace_period: "pinjaman",
  tenor_min: "pinjaman",
  tenor_max: "pinjaman",
}

const KATEGORI_LABEL: Record<string, string> = {
  pinjaman: "Pinjaman",
}

const KATEGORI_ORDER = ["pinjaman"]

const DEFAULT_TIPE: Record<string, string> = {
  plafon_max_saldo: "DECIMAL",
  denda_per_hari: "DECIMAL",
  grace_period: "NUMBER",
  tenor_min: "NUMBER",
  tenor_max: "NUMBER",
}

export function KonfigurasiPage({
  konfig, akun, generalInfo,
  jenisPinjaman, jenisSimpanan,
}: {
  konfig: KonfigItem[]
  akun: AkunItem[]
  generalInfo: GeneralInfoItem
  jenisPinjaman: JenisPinjamanItem[]
  jenisSimpanan: JenisSimpananItem[]
}) {
  const router = useRouter()
  const [locked, setLocked] = useState(true)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const k of konfig) map[k.key] = k.value
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)

  // General Info
  const [gi, setGi] = useState({
    namaKoperasi: generalInfo?.namaKoperasi ?? "",
    alamat: generalInfo?.alamat ?? "",
    noAhu: generalInfo?.noAhu ?? "",
    logo: generalInfo?.logo ?? "",
    website: generalInfo?.website ?? "",
  })
  const [giSaving, setGiSaving] = useState(false)
  const [giError, setGiError] = useState("")
  const [logouploading, setLogouploading] = useState(false)

  // Akun dialog
  const [akunDialog, setAkunDialog] = useState(false)
  const [akunForm, setAkunForm] = useState({ kode: "", nama: "", tipe: "ASET", saldoNormal: "DEBIT" })
  const [akunError, setAkunError] = useState("")

  // Confirm dialog
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)

  // Jenis Pinjaman dialog
  const [jpDialog, setJpDialog] = useState(false)
  const [jpForm, setJpForm] = useState({ id: "", nama: "", bunga: 0, keterangan: "" })
  const [jpError, setJpError] = useState("")
  const [jpEditing, setJpEditing] = useState(false)

  // Jenis Simpanan dialog
  const [jsDialog, setJsDialog] = useState(false)
  const [jsForm, setJsForm] = useState({ id: "", kode: "", nama: "", minimalSetoran: 0, keterangan: "" })
  const [jsError, setJsError] = useState("")
  const [jsEditing, setJsEditing] = useState(false)

  async function handleSaveCategory(cat: string) {
    setConfirm(null)
    setSaving(cat)
    try {
      const items = konfig.filter((k) => GROUP_CATEGORY[k.key] === cat)
      for (const item of items) {
        await updateKonfig(item.key, values[item.key] ?? "")
      }
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(null)
    }
  }

  async function handleUploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogouploading(true)
    try {
      const formData = new FormData()
      formData.set("file", file)
      formData.set("type", "logo")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Gagal upload")
      setGi({ ...gi, logo: data.url })
    } catch (err) {
      setGiError((err as Error).message)
    } finally {
      setLogouploading(false)
    }
  }

  async function handleSaveGeneralInfo() {
    setConfirm(null)
    setGiSaving(true)
    setGiError("")
    try {
      await updateGeneralInfo(gi)
      router.refresh()
    } catch (e) {
      setGiError((e as Error).message)
    } finally {
      setGiSaving(false)
    }
  }

  async function handleCreateAkun() {
    setConfirm(null)
    setAkunError("")
    try {
      await createAkun(akunForm as { kode: string; nama: string; tipe: "ASET" | "LIABILITAS" | "EKUITAS" | "PENDAPATAN" | "BEBAN"; saldoNormal: "DEBIT" | "KREDIT" })
      setAkunDialog(false)
      setAkunForm({ kode: "", nama: "", tipe: "ASET", saldoNormal: "DEBIT" })
      router.refresh()
    } catch (e) {
      setAkunError((e as Error).message)
    }
  }

  async function handleToggleAkun(id: string) {
    try {
      await toggleAkunActive(id)
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSaveJenisPinjaman() {
    setConfirm(null)
    setJpError("")
    try {
      if (jpEditing) {
        await updateJenisPinjaman(jpForm.id, { nama: jpForm.nama, bunga: jpForm.bunga, keterangan: jpForm.keterangan || null })
      } else {
        await createJenisPinjaman({ nama: jpForm.nama, bunga: jpForm.bunga, keterangan: jpForm.keterangan || null })
      }
      setJpDialog(false)
      setJpForm({ id: "", nama: "", bunga: 0, keterangan: "" })
      setJpEditing(false)
      router.refresh()
    } catch (e) {
      setJpError((e as Error).message)
    }
  }

  async function handleDeleteJenisPinjaman(id: string) {
    setConfirm(null)
    try {
      await deleteJenisPinjaman(id)
      router.refresh()
    } catch (e) {
      alert((e as Error).message)
    }
  }

  function openEditJenisPinjaman(item: JenisPinjamanItem) {
    setJpForm({ id: item.id, nama: item.nama, bunga: item.bunga, keterangan: item.keterangan ?? "" })
    setJpEditing(true)
    setJpError("")
    setJpDialog(true)
  }

  async function handleSaveJenisSimpanan() {
    setConfirm(null)
    setJsError("")
    try {
      if (jsEditing) {
        await updateJenisSimpanan(jsForm.id, { kode: jsForm.kode, nama: jsForm.nama, minimalSetoran: jsForm.minimalSetoran, keterangan: jsForm.keterangan || null })
      } else {
        await createJenisSimpanan({ kode: jsForm.kode, nama: jsForm.nama, minimalSetoran: jsForm.minimalSetoran, keterangan: jsForm.keterangan || null })
      }
      setJsDialog(false)
      setJsForm({ id: "", kode: "", nama: "", minimalSetoran: 0, keterangan: "" })
      setJsEditing(false)
      router.refresh()
    } catch (e) {
      setJsError((e as Error).message)
    }
  }

  async function handleToggleJenisSimpanan(id: string) {
    try {
      await toggleJenisSimpananActive(id)
      router.refresh()
    } catch (e) {
      console.error(e)
    }
  }

  function openEditJenisSimpanan(item: JenisSimpananItem) {
    setJsForm({ id: item.id, kode: item.kode, nama: item.nama, minimalSetoran: item.minimalSetoran, keterangan: item.keterangan ?? "" })
    setJsEditing(true)
    setJsError("")
    setJsDialog(true)
  }

  const konfigMap = new Map(konfig.map((k) => [k.key, k]))
  const grouped = new Map<string, KonfigItem[]>()
  const usedKeys = new Set<string>()
  for (const [key, cat] of Object.entries(GROUP_CATEGORY)) {
    if (!grouped.has(cat)) grouped.set(cat, [])
    const existing = konfigMap.get(key)
    usedKeys.add(key)
    if (existing) {
      grouped.get(cat)!.push(existing)
    } else {
      grouped.get(cat)!.push({
        id: `new-${key}`,
        key,
        value: "",
        tipeData: DEFAULT_TIPE[key] ?? "DECIMAL",
        keterangan: "",
      })
    }
  }
  for (const item of konfig) {
    if (!usedKeys.has(item.key)) {
      const cat = GROUP_CATEGORY[item.key]
      if (cat && grouped.has(cat)) {
        grouped.get(cat)!.push(item)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi koperasi dan manajemen master data</p>
      </div>

      <div className="flex items-center justify-end">
        <Button variant={locked ? "outline" : "default"} onClick={() => setLocked(!locked)} size="sm">
          {locked ? <Unlock className="mr-1 h-4 w-4" /> : <Lock className="mr-1 h-4 w-4" />}
          {locked ? "Buka Kunci" : "Kunci"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">Info Koperasi</TabsTrigger>
          <TabsTrigger value="konfig">Konfigurasi</TabsTrigger>
          <TabsTrigger value="jenis-pinjaman">Jenis Pinjaman</TabsTrigger>
          <TabsTrigger value="jenis-simpanan">Jenis Simpanan</TabsTrigger>
          <TabsTrigger value="akun">Chart of Accounts</TabsTrigger>
        </TabsList>

        {/* ─── General Info ─── */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informasi Koperasi</CardTitle>
                <Button size="sm" onClick={() => setConfirm({ title: "Simpan Info Koperasi", desc: "Simpan perubahan informasi koperasi?", onConfirm: handleSaveGeneralInfo })} disabled={giSaving || locked}>
                  <Save className="mr-1 h-3 w-3" />
                  {giSaving ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-w-lg">
              {giError && <p className="text-sm text-destructive">{giError}</p>}
              <div className="space-y-2">
                <Label>Nama Koperasi</Label>
                <Input value={gi.namaKoperasi} onChange={(e) => setGi({ ...gi, namaKoperasi: e.target.value })} disabled={locked} />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Textarea value={gi.alamat} onChange={(e) => setGi({ ...gi, alamat: e.target.value })} disabled={locked} />
              </div>
              <div className="space-y-2">
                <Label>Nomor AHU (Badan Hukum)</Label>
                <Input value={gi.noAhu} onChange={(e) => setGi({ ...gi, noAhu: e.target.value })} disabled={locked} />
              </div>
              <div className="space-y-2">
                <Label>Logo Koperasi</Label>
                <div className="flex items-center gap-4">
                  {gi.logo ? (
                    <div className="relative">
                      <img src={gi.logo} alt="Logo" className="h-16 w-16 rounded-lg border object-contain" />
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => setGi({ ...gi, logo: "" })}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                  {!locked && (
                    <label className="cursor-pointer">
                      <span className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80">
                        {logouploading ? "Uploading..." : "Pilih File"}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleUploadLogo}
                        disabled={logouploading}
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={gi.website} onChange={(e) => setGi({ ...gi, website: e.target.value })} disabled={locked} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Konfigurasi ─── */}
        <TabsContent value="konfig" className="space-y-6">
          {KATEGORI_ORDER.map((cat) => {
            const items = grouped.get(cat)
            if (!items?.length) return null
            return (
              <Card key={cat}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{KATEGORI_LABEL[cat] ?? cat}</CardTitle>
                    <Button size="sm" onClick={() => setConfirm({ title: "Simpan Konfigurasi", desc: "Simpan perubahan konfigurasi?", onConfirm: () => handleSaveCategory(cat) })} disabled={saving === cat || locked}>
                      <Save className="mr-1 h-3 w-3" />
                      {saving === cat ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.key} className="grid grid-cols-3 items-center gap-4">
                      <Label className="text-right text-sm">{GROUP_LABELS[item.key] ?? item.key}</Label>
                      <Input
                        value={values[item.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                        disabled={locked}
                        type={item.tipeData === "NUMBER" || item.tipeData === "DECIMAL" ? "number" : "text"}
                      />
                      <div />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        {/* ─── Jenis Pinjaman ─── */}
        <TabsContent value="jenis-pinjaman">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Jenis Pinjaman</CardTitle>
                <Dialog open={jpDialog && !locked} onOpenChange={(open) => { if (!open || locked) { setJpEditing(false); setJpForm({ id: "", nama: "", bunga: 0, keterangan: "" }) } setJpDialog(open && !locked) }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setJpForm({ id: "", nama: "", bunga: 0, keterangan: "" }); setJpEditing(false); setJpError("") }} disabled={locked}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{jpEditing ? "Edit" : "Tambah"} Jenis Pinjaman</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nama</Label>
                        <Input value={jpForm.nama} onChange={(e) => setJpForm({ ...jpForm, nama: e.target.value })} placeholder="Konsumsi" />
                      </div>
                      <div className="space-y-2">
                        <Label>Bunga (% per bulan)</Label>
                        <Input type="number" value={jpForm.bunga} onChange={(e) => setJpForm({ ...jpForm, bunga: Number(e.target.value) })} placeholder="2" />
                      </div>
                      <div className="space-y-2">
                        <Label>Keterangan</Label>
                        <Textarea value={jpForm.keterangan} onChange={(e) => setJpForm({ ...jpForm, keterangan: e.target.value })} />
                      </div>
                      {jpError && <p className="text-sm text-destructive">{jpError}</p>}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setJpDialog(false)}>Batal</Button>
                      <Button onClick={() => setConfirm({ title: jpEditing ? "Edit Jenis Pinjaman" : "Tambah Jenis Pinjaman", desc: "Simpan data jenis pinjaman?", onConfirm: handleSaveJenisPinjaman })}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Bunga</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jenisPinjaman.map((jp) => (
                    <TableRow key={jp.id}>
                      <TableCell className="font-medium">{jp.nama}</TableCell>
                      <TableCell>{jp.bunga}% / bln</TableCell>
                      <TableCell className="text-muted-foreground">{jp.keterangan ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditJenisPinjaman(jp)} disabled={locked}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirm({ title: "Hapus Jenis Pinjaman", desc: `Hapus "${jp.nama}"? Tindakan ini tidak dapat dikembalikan.`, onConfirm: () => handleDeleteJenisPinjaman(jp.id) })} disabled={locked}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Jenis Simpanan ─── */}
        <TabsContent value="jenis-simpanan">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Jenis Simpanan</CardTitle>
                <Dialog open={jsDialog && !locked} onOpenChange={(open) => { if (!open || locked) { setJsEditing(false); setJsForm({ id: "", kode: "", nama: "", minimalSetoran: 0, keterangan: "" }) } setJsDialog(open && !locked) }}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setJsForm({ id: "", kode: "", nama: "", minimalSetoran: 0, keterangan: "" }); setJsEditing(false); setJsError("") }} disabled={locked}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{jsEditing ? "Edit" : "Tambah"} Jenis Simpanan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Kode</Label>
                        <Input value={jsForm.kode} onChange={(e) => setJsForm({ ...jsForm, kode: e.target.value })} placeholder="POKOK" disabled={jsEditing} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama</Label>
                        <Input value={jsForm.nama} onChange={(e) => setJsForm({ ...jsForm, nama: e.target.value })} placeholder="Simpanan Pokok" />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimal Setoran (Rp)</Label>
                        <Input type="number" value={jsForm.minimalSetoran} onChange={(e) => setJsForm({ ...jsForm, minimalSetoran: Number(e.target.value) })} placeholder="100000" />
                      </div>
                      <div className="space-y-2">
                        <Label>Keterangan</Label>
                        <Textarea value={jsForm.keterangan} onChange={(e) => setJsForm({ ...jsForm, keterangan: e.target.value })} />
                      </div>
                      {jsError && <p className="text-sm text-destructive">{jsError}</p>}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setJsDialog(false)}>Batal</Button>
                      <Button onClick={() => setConfirm({ title: jsEditing ? "Edit Jenis Simpanan" : "Tambah Jenis Simpanan", desc: "Simpan data jenis simpanan?", onConfirm: handleSaveJenisSimpanan })}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Min. Setoran</TableHead>
                    <TableHead className="text-center">Aktif</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jenisSimpanan.map((js) => (
                    <TableRow key={js.id}>
                      <TableCell className="font-mono">{js.kode}</TableCell>
                      <TableCell>{js.nama}</TableCell>
                      <TableCell>Rp{js.minimalSetoran.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={js.isActive}
                            onCheckedChange={() => handleToggleJenisSimpanan(js.id)}
                            disabled={locked}
                          />
                          <span className={`text-xs ${js.isActive ? "text-primary" : "text-muted-foreground"}`}>
                            {js.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditJenisSimpanan(js)} disabled={locked}><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── COA ─── */}
        <TabsContent value="akun">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Akun</CardTitle>
                <Dialog open={akunDialog && !locked} onOpenChange={(open) => setAkunDialog(open && !locked)}>
                  <DialogTrigger asChild>
                    <Button disabled={locked}>
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Akun
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Tambah Akun Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Kode Akun</Label>
                        <Input value={akunForm.kode} onChange={(e) => setAkunForm({ ...akunForm, kode: e.target.value })} placeholder="1.1.5" />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Akun</Label>
                        <Input value={akunForm.nama} onChange={(e) => setAkunForm({ ...akunForm, nama: e.target.value })} placeholder="Nama Akun" />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipe</Label>
                        <Select value={akunForm.tipe} onValueChange={(v) => setAkunForm({ ...akunForm, tipe: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ASET">ASET</SelectItem>
                            <SelectItem value="LIABILITAS">LIABILITAS</SelectItem>
                            <SelectItem value="EKUITAS">EKUITAS</SelectItem>
                            <SelectItem value="PENDAPATAN">PENDAPATAN</SelectItem>
                            <SelectItem value="BEBAN">BEBAN</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Saldo Normal</Label>
                        <Select value={akunForm.saldoNormal} onValueChange={(v) => setAkunForm({ ...akunForm, saldoNormal: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DEBIT">DEBIT</SelectItem>
                            <SelectItem value="KREDIT">KREDIT</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {akunError && <p className="text-sm text-destructive">{akunError}</p>}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAkunDialog(false)}>Batal</Button>
                      <Button onClick={() => setConfirm({ title: "Tambah Akun", desc: "Buat akun baru?", onConfirm: handleCreateAkun })}>Simpan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Saldo Normal</TableHead>
                    <TableHead className="text-center">Aktif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {akun.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono">{a.kode}</TableCell>
                      <TableCell>{a.nama}</TableCell>
                      <TableCell><Badge variant="outline">{a.tipe}</Badge></TableCell>
                      <TableCell>{a.saldoNormal}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={a.isActive}
                            onCheckedChange={() => handleToggleAkun(a.id)}
                            disabled={locked}
                          />
                          <span className={`text-xs ${a.isActive ? "text-primary" : "text-muted-foreground"}`}>
                            {a.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
