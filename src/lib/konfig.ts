import { prisma } from "@/lib/prisma"

export type KonfigMap = Record<string, string>

let konfigCache: KonfigMap | null = null
let konfigCacheTime = 0
const CACHE_TTL = 60_000 // 1 minute

export function invalidateKonfigCache() {
  konfigCache = null
  konfigCacheTime = 0
}

export async function getKonfig(): Promise<KonfigMap> {
  const now = Date.now()
  if (konfigCache && now - konfigCacheTime < CACHE_TTL) {
    return konfigCache
  }
  const rows = await prisma.konfigurasi.findMany()
  const map: KonfigMap = {}
  for (const r of rows) {
    map[r.key] = r.value
  }
  konfigCache = map
  konfigCacheTime = now
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
