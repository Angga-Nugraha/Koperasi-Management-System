"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

type Props = {
  data: { bulan: string; setoran: number; penarikan: number }[]
}

const CHART_CONFIG = {
  setoran: { label: "Setoran", color: "#10b981" },
  penarikan: { label: "Penarikan", color: "#f43f5e" },
}

export function SimpananChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data transaksi</p>
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-[2/1]">
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="bulan" tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip content={<ChartTooltipContent />} />
        <Legend />
        <Bar dataKey="setoran" fill={CHART_CONFIG.setoran.color} radius={[4, 4, 0, 0]} />
        <Bar dataKey="penarikan" fill={CHART_CONFIG.penarikan.color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
