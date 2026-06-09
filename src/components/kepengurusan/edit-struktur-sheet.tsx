"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { upsertKepengurusan, kosongkanJabatan } from "@/actions/kepengurusan"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, UserX } from "lucide-react"
import { cn } from "@/lib/utils"

type AnggotaOption = {
  id: string
  nama: string
  noAnggota: string
  nik: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: {
    id: string
    jabatan: string
    tipe: string
    anggotaId: string | null
  }
  anggotaList: AnggotaOption[]
}

export function EditStrukturSheet({ open, onOpenChange, item, anggotaList }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [anggotaId, setAnggotaId] = useState(item.anggotaId ?? "")
  const [confirm, setConfirm] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null)

  const selectedAnggota = anggotaList.find((a) => a.id === anggotaId)

  async function handleSubmit() {
    setConfirm(null)
    if (!anggotaId) {
      setError("Pilih anggota terlebih dahulu")
      return
    }
    setLoading(true)
    setError(null)
    try {
      await upsertKepengurusan({ jabatan: item.jabatan, anggotaId })
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setLoading(false)
    }
  }

  async function handleKosongkan() {
    setConfirm(null)
    setLoading(true)
    setError(null)
    try {
      await kosongkanJabatan(item.id)
      setAnggotaId("")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmitClick(e: React.FormEvent) {
    e.preventDefault()
    setConfirm({
      title: `Edit ${item.jabatan}`,
      desc: `Simpan perubahan untuk jabatan ${item.jabatan}?`,
      onConfirm: handleSubmit,
    })
  }

  function handleKosongkanClick() {
    setConfirm({
      title: `Kosongkan ${item.jabatan}`,
      desc: `Hapus penugasan untuk jabatan ${item.jabatan}?`,
      onConfirm: handleKosongkan,
    })
  }

  return (
    <>
      <Sheet key={item.jabatan} open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{item.jabatan}</SheetTitle>
            <SheetDescription>{item.tipe === "PENGURUS" ? "Pengurus" : "Pengawas"}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <form onSubmit={handleSubmitClick} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              <div className="space-y-2">
                <Label>Nama Anggota</Label>
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboOpen}
                      className="w-full justify-between"
                    >
                      {selectedAnggota
                        ? `${selectedAnggota.nama} (${selectedAnggota.noAnggota})`
                        : "Pilih anggota..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Cari anggota..." />
                      <CommandList>
                        <CommandEmpty>Anggota tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {anggotaList.map((a) => (
                            <CommandItem
                              key={a.id}
                              value={`${a.nama} ${a.noAnggota} ${a.nik}`}
                              onSelect={() => {
                                setAnggotaId(a.id)
                                setComboOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  anggotaId === a.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span className="flex-1">{a.nama}</span>
                              <span className="text-xs text-muted-foreground">{a.noAnggota}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                  Batal
                </Button>
              </div>
            </form>

            {item.anggotaId && (
              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm" onClick={handleKosongkanClick} disabled={loading}>
                  <UserX className="mr-2 h-4 w-4" />
                  Kosongkan Jabatan
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

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
    </>
  )
}
