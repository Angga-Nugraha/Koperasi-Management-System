/**
 * @file src/lib/konfig.ts
 * @description Utilitas caching dan pengambilan nilai konfigurasi sistem dari database.
 */

import { prisma } from "@/lib/prisma"

export type KonfigMap = Record<string, string>

export async function getKonfig(): Promise<KonfigMap> {
  const rows = await prisma.konfigurasi.findMany()
  const map: KonfigMap = {}
  for (const r of rows) {
    map[r.key] = r.value
  }
  return map
}

export function getNumber(konfig: KonfigMap, key: string, fallback: number): number {
  const v = konfig[key]
  if (v === undefined || v === "") return fallback
  const n = Number(v)
  return isNaN(n) ? fallback : n
}

export function getString(konfig: KonfigMap, key: string, fallback: string): string {
  return konfig[key] ?? fallback
}
