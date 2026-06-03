"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Printer, X } from "lucide-react"
import { toPng } from "html-to-image"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  anggota: {
    noAnggota: string
    nama: string
    nik: string
    alamat: string
    pekerjaan: string | null
    tglMasuk: string
    foto: string | null
  }
}

function CardFront({ anggota, generalInfo }: { anggota: Props["anggota"]; generalInfo: { namaKoperasi: string; alamat: string | null; logo: string | null } }) {
  const tgl = new Date(anggota.tglMasuk).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  })

  return (
    <div className="flex flex-col overflow-hidden rounded-xl shadow-xl print:shadow-none"
      style={{ width: "85.6mm", height: "54mm" }}>
      <div className="flex h-full flex-col">
        <div className="relative flex-1 bg-gradient-to-b from-red-700 to-red-500 p-4 text-white">
          {generalInfo.logo && (
            <img src={generalInfo.logo} alt="" className="absolute left-1/2 top-1/2 h-50 w-40 -translate-x-1/2 -translate-y-1/2 object-contain opacity-20" />
          )}
          <div className="relative z-20 flex justify-center">
            {generalInfo.logo && (
              <img src={generalInfo.logo} alt="" className="absolute left-0 top-0 h-8 w-8 rounded-full bg-white object-contain p-0.5" />
            )}
            <div className="text-center text-[8px] leading-tight max-w-[180px]">
              <p className="text-[8px] font-bold uppercase tracking-wider">{generalInfo.namaKoperasi}</p>
              <p className="font-medium text-red-200">KARTU TANDA ANGGOTA</p>
            </div>
          </div>

          <hr className="my-1.5 border-dashed border-white/20" />

          <div className="flex gap-4">
            <div className="flex shrink-0 items-center justify-center">
              {anggota.foto ? (
                <img src={anggota.foto} alt="" className="h-16 w-12 rounded border border-white/40 object-cover" />
              ) : (
                <div className="flex h-16 w-12 items-center justify-center rounded border border-white/40 bg-white/10 text-[6px] text-red-200">
                  FOTO
                </div>
              )}
            </div>

            <div className="flex-1 space-y-0.5 text-[6px]">
              <div>
                <span className="text-red-200">No Anggota</span>
                <p className="text-[11px] font-bold tracking-wider">{anggota.noAnggota}</p>
              </div>
              <div>
                <span className="text-red-200">Nama</span>
                <p className="text-[9px] font-semibold leading-tight">{anggota.nama}</p>
              </div>
              <div className="grid grid-cols-2 gap-x-2">
                <div>
                  <span className="text-red-200">NIK</span>
                  <p className="text-[7px] font-medium">{anggota.nik}</p>
                </div>
                <div>
                  <span className="text-red-200">Pekerjaan</span>
                  <p className="text-[7px] font-medium">{anggota.pekerjaan || "-"}</p>
                </div>
              </div>
              <div>
                <span className="text-red-200">Alamat</span>
                <p className="text-[7px] font-medium leading-tight">{anggota.alamat}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-white px-3 py-1 text-[6px] text-gray-700">
          <div className="flex justify-between">
            <span>Tgl Masuk: {tgl}</span>
            <span>Berlaku selama aktif</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function KartuAnggotaCard({ open, onOpenChange, anggota }: Props) {
  const [mounted, setMounted] = useState(false)
  const [generalInfo, setGeneralInfo] = useState<{ namaKoperasi: string; alamat: string | null; logo: string | null } | null>(null)
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])
  useEffect(() => {
    fetch("/api/general-info").then(r => r.json()).then(setGeneralInfo).catch(() => {})
  }, [])

  async function handleDownload() {
    const el = cardRef.current
    if (!el) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(el, { quality: 1, pixelRatio: 4 })
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `kartu-anggota-${anggota.noAnggota}.png`
      a.click()
    } catch {
      // fallback
    } finally {
      setDownloading(false)
    }
  }

  if (!generalInfo) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-fit max-w-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Kartu Anggota</DialogTitle>
            <DialogDescription>Kartu tanda anggota koperasi</DialogDescription>
          </DialogHeader>

          <div className="flex justify-center" ref={cardRef}>
            <CardFront anggota={anggota} generalInfo={generalInfo} />
          </div>

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" /> {downloading ? "..." : "Download"}
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Cetak
            </Button>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" /> Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {mounted && createPortal(
        <div id="print-kartu" className="print-kartu">
          <CardFront anggota={anggota} generalInfo={generalInfo} />
        </div>,
        document.body,
      )}
    </>
  )
}
