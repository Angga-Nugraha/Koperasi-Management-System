"use client"

/**
 * @file src/components/struk-pembayaran.tsx
 * @description Komponen presentasional / interaktif: struk-pembayaran.
 */

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Printer, X } from "lucide-react"
import {formatTanggal} from "@/lib/format"


type GeneralInfo = {
  namaKoperasi: string
  alamat: string | null
  noAhu: string | null
  logo: string | null
}

type StrukSimpanan = {
  jenis: "simpanan"
  noStruk: string
  tipe: "SETORAN" | "PENARIKAN"
  nominal: number
  keterangan: string | null
  createdAt: string
  anggota: { nama: string; noAnggota: string }
  jenisSimpanan: { nama: string; kode: string }
  petugas: string
}

type StrukAngsuran = {
  jenis: "angsuran"
  noStruk: string
  angsuranKe: number
  pokok: number
  jasa: number
  denda: number
  total: number
  tglBayar: string
  anggota: { nama: string; noAnggota: string }
  pinjaman: { id: string; jumlah: number; sisaPinjaman: number; isLunas: boolean }
  petugas: string
}

type StrukTagihan = {
  jenis: "tagihan"
  noStruk: string
  nominal: number
  createdAt: string
  anggota: { nama: string; noAnggota: string }
  petugas: string
  bulan: number
  tahun: number
}

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  generalInfo: GeneralInfo
  data: StrukSimpanan | StrukAngsuran | StrukTagihan
}

function formatRp(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`
}

function StrukContent({ generalInfo, data }: { generalInfo: GeneralInfo; data: StrukSimpanan | StrukAngsuran | StrukTagihan }) {
  return (
    <div className="space-y-2 text-[10px]">
      <div className="flex flex-col items-center gap-1 text-center">
        {generalInfo.logo && (
          <Image src={generalInfo.logo} alt="" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded object-contain" />
        )}
        <div>
          <h2 className="text-xs font-bold leading-tight">{generalInfo.namaKoperasi}</h2>
          {generalInfo.noAhu && (
            <p className="text-[9px] font-semibold">No AHU {generalInfo.noAhu}</p>
          )}
          {generalInfo.alamat && (
            <p className="text-[7px] leading-tight text-muted-foreground">{generalInfo.alamat}</p>
          )}
        </div>
      </div>

      <hr className="border-dashed" />

      <div className="text-center">
        <p className="font-mono text-[11px] font-semibold">{data.noStruk}</p>
      </div>

      <hr className="border-dashed" />

      {data.jenis === "simpanan" && (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal</span>
            <span>{formatTanggal(data.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Anggota</span>
            <span>{data.anggota.nama} ({data.anggota.noAnggota})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis</span>
            <span>{data.tipe === "SETORAN" ? "Setoran" : "Penarikan"} {data.jenisSimpanan.nama}</span>
          </div>
          <hr className="border-dashed" />
          <div className="flex justify-between font-semibold">
            <span>Nominal</span>
            <span>{formatRp(data.nominal)}</span>
          </div>
          {data.keterangan && (
            <div className="flex justify-between text-muted-foreground">
              <span>Keterangan</span>
              <span>{data.keterangan}</span>
            </div>
          )}
        </div>
      )}

      {data.jenis === "angsuran" && (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal</span>
            <span>{formatTanggal(data.tglBayar)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Anggota</span>
            <span>{data.anggota.nama} ({data.anggota.noAnggota})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pembayaran</span>
            <span>Angsuran ke-{data.angsuranKe}</span>
          </div>
          <hr className="border-dashed" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pokok</span>
            <span>{formatRp(data.pokok)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jasa</span>
            <span>{formatRp(data.jasa)}</span>
          </div>
          {data.denda > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Denda</span>
              <span>{formatRp(data.denda)}</span>
            </div>
          )}
          <hr className="border-dashed" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatRp(data.total)}</span>
          </div>
          {data.pinjaman.isLunas && (
            <p className="pt-1 text-center text-[9px] font-semibold text-green-600">LUNAS</p>
          )}
        </div>
      )}

      {data.jenis === "tagihan" && (
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal</span>
            <span>{formatTanggal(data.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Anggota</span>
            <span>{data.anggota.nama} ({data.anggota.noAnggota})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis</span>
            <span>Tagihan Simpanan Wajib</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Periode</span>
            <span>{BULAN[data.bulan]} {data.tahun}</span>
          </div>
          <hr className="border-dashed" />
          <div className="flex justify-between font-semibold">
            <span>Nominal</span>
            <span>{formatRp(data.nominal)}</span>
          </div>
        </div>
      )}

      <hr className="border-dashed" />

      <div className="text-center text-[9px] text-muted-foreground">
        <p>Petugas: {data.petugas}</p>
        <p className="mt-1">Terima kasih atas kepercayaan Anda</p>
      </div>
    </div>
  )
}

export function StrukPembayaran({ open, onOpenChange, generalInfo, data }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[340px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Struk Pembayaran</DialogTitle>
            <DialogDescription>Struk pembayaran transaksi</DialogDescription>
          </DialogHeader>

          <StrukContent generalInfo={generalInfo} data={data} />

          <div className="flex justify-center gap-3">
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
        <div id="print-receipt" className="print-receipt">
          <StrukContent generalInfo={generalInfo} data={data} />
        </div>,
        document.body
      )}
    </>
  )
}
