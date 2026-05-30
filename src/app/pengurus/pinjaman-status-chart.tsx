"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

type Props = {
  data: { status: string; count: number; total: number }[]
}

const COLORS: Record<string, string> = {
  PENGAJUAN: "hsl(var(--chart-1))",
  DISETUJUI: "hsl(var(--chart-2))",
  DICAIKAN: "hsl(var(--chart-3))",
  LUNAS: "hsl(var(--chart-4))",
  DITOLAK: "hsl(var(--chart-5))",
}

const LABELS: Record<string, string> = {
  PENGAJUAN: "Pengajuan",
  DISETUJUI: "Disetujui",
  DICAIKAN: "Dicairkan",
  LUNAS: "Lunas",
  DITOLAK: "Ditolak",
}

const CHART_CONFIG = {
  pengajuan: { label: "Pengajuan", color: COLORS.PENGAJUAN },
  disetujui: { label: "Disetujui", color: COLORS.DISETUJUI },
  dicairkan: { label: "Dicairkan", color: COLORS.DICAIKAN },
  lunas: { label: "Lunas", color: COLORS.LUNAS },
  ditolak: { label: "Ditolak", color: COLORS.DITOLAK },
}

export function PinjamanStatusChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data pinjaman</p>
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="aspect-[2/1]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ status, count }) => `${LABELS[status] ?? status}: ${count}`}
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={COLORS[entry.status] ?? "hsl(var(--chart-5))"} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltipContent />} />
          <Legend formatter={(value: string) => LABELS[value] ?? value} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
