"use client"

/**
 * @file src/app/pengurus/simpanan-chart.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: simpanan-chart.
 */

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { formatCompact } from "@/lib/format"

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
    <div className="overflow-x-auto">
      <ChartContainer config={CHART_CONFIG} className="min-h-[250px] w-full md:aspect-[2/1]">
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-muted-foreground"
            tickFormatter={formatCompact}
          />
          <Tooltip
            content={
              <ChartTooltipContent
                formatter={(value: any) => `Rp ${Number(value).toLocaleString("id-ID")}`}
              />
            }
          />
          <Legend />
          <Bar dataKey="setoran" fill={CHART_CONFIG.setoran.color} radius={[4, 4, 0, 0]} />
          <Bar dataKey="penarikan" fill={CHART_CONFIG.penarikan.color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
