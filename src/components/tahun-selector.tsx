"use client"

/**
 * @file src/components/tahun-selector.tsx
 * @description Komponen presentasional / interaktif: tahun-selector.
 */

import { useRouter } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Props = {
  tahun: number
  daftarTahun: number[]
}

export function TahunSelector({ tahun, daftarTahun }: Props) {
  const router = useRouter()

  return (
    <Select
      value={String(tahun)}
      onValueChange={(v) => {
        const params = new URLSearchParams(window.location.search)
        params.set("tahun", v)
        router.push(`?${params.toString()}`)
      }}
    >
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Pilih tahun" />
      </SelectTrigger>
      <SelectContent>
        {daftarTahun.map((t) => (
          <SelectItem key={t} value={String(t)}>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
