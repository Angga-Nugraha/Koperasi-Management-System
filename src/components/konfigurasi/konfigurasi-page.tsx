"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getKonfigList, updateKonfig, getAkunList, createAkun, toggleAkunActive } from "@/actions/konfigurasi"
import { Save, Plus, Power, PowerOff } from "lucide-react"

type KonfigItem = Awaited<ReturnType<typeof getKonfigList>>[number]
type AkunItem = Awaited<ReturnType<typeof getAkunList>>[number]

const GROUP_LABELS: Record<string, string> = {
  plafon_max_saldo: "Plafon Pinjaman",
  bunga_pinjaman: "Bunga Pinjaman",
  denda_per_hari: "Denda",
  grace_period: "Tenggang Waktu",
  tenor_min: "Tenor Minimal",
  tenor_max: "Tenor Maximal",
  simpanan_pokok: "Simpanan Pokok",
  simpanan_wajib_perbulan: "Simpanan Wajib",
  simpanan_wajib_tgl_jatuh_tempo: "Jatuh Tempo Wajib",
  alokasi_jm: "Alokasi Jasa Modal",
  alokasi_ju: "Alokasi Jasa Usaha",
  alokasi_cad: "Alokasi Cadangan",
  alokasi_pengurus: "Alokasi Pengurus",
  alokasi_pengawas: "Alokasi Pengawas",
  alokasi_sosial: "Alokasi Dana Sosial",
  no_anggota_prefix: "Prefix Anggota",
  nama_koperasi: "Nama Koperasi",
  alamat_koperasi: "Alamat Koperasi",
}

const GROUP_CATEGORY: Record<string, string> = {
  nama_koperasi: "umum",
  alamat_koperasi: "umum",
  no_anggota_prefix: "umum",
  plafon_max_saldo: "pinjaman",
  bunga_pinjaman: "pinjaman",
  denda_per_hari: "pinjaman",
  grace_period: "pinjaman",
  tenor_min: "pinjaman",
  tenor_max: "pinjaman",
  simpanan_pokok: "simpanan",
  simpanan_wajib_perbulan: "simpanan",
  simpanan_wajib_tgl_jatuh_tempo: "simpanan",
  alokasi_jm: "shu",
  alokasi_ju: "shu",
  alokasi_cad: "shu",
  alokasi_pengurus: "shu",
  alokasi_pengawas: "shu",
  alokasi_sosial: "shu",
}

const KATEGORI_ORDER = ["umum", "pinjaman", "simpanan", "shu"]

export function KonfigurasiPage({ konfig, akun }: { konfig: KonfigItem[]; akun: AkunItem[] }) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const k of konfig) map[k.key] = k.value
    return map
  })
  const [saving, setSaving] = useState<string | null>(null)
  const [akunDialog, setAkunDialog] = useState(false)
  const [akunForm, setAkunForm] = useState({ kode: "", nama: "", tipe: "ASET", saldoNormal: "DEBIT" })
  const [akunError, setAkunError] = useState("")

  async function handleSave(key: string) {
    setSaving(key)
    try {
      await updateKonfig(key, values[key])
      router.refresh()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(null)
    }
  }

  async function handleCreateAkun() {
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

  const grouped = new Map<string, KonfigItem[]>()
  for (const item of konfig) {
    const cat = GROUP_CATEGORY[item.key] ?? "umum"
    if (!grouped.has(cat)) grouped.set(cat, [])
    grouped.get(cat)!.push(item)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Konfigurasi koperasi dan manajemen akun</p>
      </div>

      <Tabs defaultValue="konfig">
        <TabsList>
          <TabsTrigger value="konfig">Konfigurasi</TabsTrigger>
          <TabsTrigger value="akun">Chart of Accounts (COA)</TabsTrigger>
        </TabsList>

        <TabsContent value="konfig" className="space-y-6">
          {KATEGORI_ORDER.map((cat) => {
            const items = grouped.get(cat)
            if (!items?.length) return null
            return (
              <Card key={cat}>
                <CardHeader>
                  <CardTitle className="capitalize">{cat}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {items.map((item) => (
                    <div key={item.key} className="grid grid-cols-3 items-center gap-4">
                      <Label className="text-right text-sm">
                        {GROUP_LABELS[item.key] ?? item.key}
                        {item.keterangan && (
                          <p className="text-xs text-muted-foreground font-normal">{item.keterangan}</p>
                        )}
                      </Label>
                      <Input
                        value={values[item.key] ?? ""}
                        onChange={(e) => setValues({ ...values, [item.key]: e.target.value })}
                        type={item.tipeData === "NUMBER" || item.tipeData === "DECIMAL" ? "number" : "text"}
                      />
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleSave(item.key)} disabled={saving === item.key}>
                          <Save className="mr-1 h-3 w-3" />
                          {saving === item.key ? "..." : "Simpan"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </TabsContent>

        <TabsContent value="akun">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Daftar Akun</CardTitle>
                <Dialog open={akunDialog} onOpenChange={setAkunDialog}>
                  <DialogTrigger asChild>
                    <Button>
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
                        <Input
                          value={akunForm.kode}
                          onChange={(e) => setAkunForm({ ...akunForm, kode: e.target.value })}
                          placeholder="1.1.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nama Akun</Label>
                        <Input
                          value={akunForm.nama}
                          onChange={(e) => setAkunForm({ ...akunForm, nama: e.target.value })}
                          placeholder="Nama Akun"
                        />
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
                      <Button onClick={handleCreateAkun}>Simpan</Button>
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
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
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
                        <Badge variant={a.isActive ? "default" : "secondary"}>
                          {a.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleToggleAkun(a.id)} title={a.isActive ? "Nonaktifkan" : "Aktifkan"}>
                          {a.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
