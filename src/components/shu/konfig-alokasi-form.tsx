"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getKonfigAlokasi, updateKonfigAlokasi } from "@/actions/shu"
import { ArrowLeft, Save } from "lucide-react"

type Konfig = Awaited<ReturnType<typeof getKonfigAlokasi>>

export function KonfigAlokasiForm({ data: initial }: { data: Konfig }) {
  const router = useRouter()
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const total = data.jmPersen + data.juPersen + data.cadPersen + data.pengurusPersen + data.pengawasPersen + data.sosialPersen

  async function handleSave() {
    if (Math.abs(total - 100) > 0.01) {
      setError("Total persentase harus 100%")
      return
    }
    setLoading(true)
    setError("")
    try {
      await updateKonfigAlokasi(data)
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const fields: Array<{ key: keyof Konfig; label: string }> = [
    { key: "jmPersen", label: "Jasa Modal (JM)" },
    { key: "juPersen", label: "Jasa Usaha (JU)" },
    { key: "cadPersen", label: "Cadangan" },
    { key: "pengurusPersen", label: "Pengurus" },
    { key: "pengawasPersen", label: "Pengawas" },
    { key: "sosialPersen", label: "Pendidikan & Sosial" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/pengurus/shu")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Konfigurasi Alokasi SHU</h1>
          <p className="text-sm text-muted-foreground">Atur persentase pembagian SHU untuk setiap pos</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Persentase Alokasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map(({ key, label }) => (
            <div key={key} className="grid grid-cols-3 items-center gap-4">
              <Label className="text-right">{label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={data[key]}
                  onChange={(e) => setData({ ...data, [key]: Number(e.target.value) })}
                />
                <span className="text-sm text-muted-foreground w-4">%</span>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className={`text-lg font-bold ${Math.abs(total - 100) < 0.01 ? "text-green-600" : "text-destructive"}`}>
              {total}%
            </span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
