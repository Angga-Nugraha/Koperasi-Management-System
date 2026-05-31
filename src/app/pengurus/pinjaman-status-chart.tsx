"use client"

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { ChartContainer, type ChartConfig, ChartTooltipContent } from "@/components/ui/chart"

type Props = {
  data: { status: string; count: number; total: number }[]
}

const COLORS: Record<string, string> = {
  PENGAJUAN: "#3b82f6",
  DISETUJUI: "#f59e0b",
  DICAIKAN: "#10b981",
  LUNAS: "#14b8a6",
  DITOLAK: "#ef4444",
}

const LABELS: Record<string, string> = {
  PENGAJUAN: "Pengajuan",
  DISETUJUI: "Disetujui",
  DICAIKAN: "Dicairkan",
  LUNAS: "Lunas",
  DITOLAK: "Ditolak",
}

const CHART_CONFIG: ChartConfig = {
  pengajuan: { label: "Pengajuan", color: "#3b82f6" },
  disetujui: { label: "Disetujui", color: "#f59e0b" },
  dicairkan: { label: "Dicairkan", color: "#10b981" },
  lunas: { label: "Lunas", color: "#14b8a6" },
  ditolak: { label: "Ditolak", color: "#ef4444" },
}

export function PinjamanStatusChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data pinjaman</p>
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="min-h-[250px] w-full md:aspect-[2/1]">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          outerRadius="40%"
          label={({ status, count }) => `${LABELS[status] ?? status}: ${count}`}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={COLORS[entry.status] ?? "#6b7280"} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
        <Legend formatter={(value: string) => LABELS[value] ?? value} />
      </PieChart>
    </ChartContainer>
  )
}
