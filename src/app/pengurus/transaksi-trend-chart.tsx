"use client"

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { formatCompact } from "@/lib/format"

type Props = {
  data: { bulan: string; masuk: number; keluar: number }[]
}

export function TransaksiTrendChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada data transaksi</p>
  }

  return (
    <div className="h-[250px] w-full overflow-x-auto">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" tickFormatter={formatCompact} />
          <Tooltip
            formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, undefined]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="masuk"
            name="Uang Masuk"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="keluar"
            name="Uang Keluar"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
