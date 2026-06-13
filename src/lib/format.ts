/**
 * @file src/lib/format.ts
 * @description Helper untuk memformat mata uang (Rupiah), tanggal, dan angka.
 */

export function formatTanggal(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatCompact(v: number): string {
  if (v >= 1_000_000_000_000) return `${(v / 1_000_000_000_000).toFixed(1).replace(/\.0$/, "")}T`
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (v >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`
  return `${v}`
}

export function formatRupiah(v: number | string | bigint): string {
  const n = typeof v === "string" ? Number(v) : typeof v === "bigint" ? Number(v) : v
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export function formatRupiahShort(v: number | string | bigint): string {
  const n = typeof v === "string" ? Number(v) : typeof v === "bigint" ? Number(v) : v
  return n.toLocaleString("id-ID")
}
