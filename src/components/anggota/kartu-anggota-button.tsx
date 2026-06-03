"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"
import { KartuAnggotaCard } from "./kartu-anggota-card"

type Props = {
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

export function KartuAnggotaButton({ anggota }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <CreditCard className="mr-2 h-4 w-4" />
        Kartu Anggota
      </Button>
      <KartuAnggotaCard open={open} onOpenChange={setOpen} anggota={anggota} />
    </>
  )
}
