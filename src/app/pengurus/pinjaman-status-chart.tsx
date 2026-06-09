"use client"

/**
 * @file src/app/pengurus/pinjaman-status-chart.tsx
 * @description Halaman dashboard/fitur pengurus untuk modul: pinjaman-status-chart.
 */

import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { ChartContainer, type ChartConfig, ChartTooltipContent } from "@/components/ui/chart"

type Props = {
  data: { status: string; count: number; total: number }[]
}

const COLORS: Record<string, string> = {
  PENGAJUAN: "#eab308",
  DISETUJUI: "#f59e0b",
  DICAIRKAN: "#3b82f6",
  LUNAS: "#22c55e",
  DITOLAK: "#ef4444",
  GAGAL: "#4b5563",
}

const LABELS: Record<string, string> = {
  PENGAJUAN: "Pengajuan",
  DISETUJUI: "Disetujui",
  DICAIRKAN: "Dicairkan",
  LUNAS: "Lunas",
  DITOLAK: "Ditolak",
  GAGAL: "Gagal",
}

const CHART_CONFIG: ChartConfig = {
  PENGAJUAN: { label: "Pengajuan", color: "#eab308" },
  DISETUJUI: { label: "Disetujui", color: "#f59e0b" },
  DICAIRKAN: { label: "Dicairkan", color: "#3b82f6" },
  LUNAS: { label: "Lunas", color: "#22c55e" },
  DITOLAK: { label: "Ditolak", color: "#ef4444" },
  GAGAL: { label: "Gagal", color: "#4b5563" },
}

export function PinjamanStatusChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data pinjaman</p>
  }

  return (
    <div className="overflow-x-auto">
      <ChartContainer config={CHART_CONFIG} className="min-h-[250px] w-full md:aspect-[2/1]">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            outerRadius="65%"
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
    </div>
  )
}
