import { prisma } from "@/lib/prisma"
import crypto from "crypto"

function pad(n: number, width: number) {
  return String(n).padStart(width, "0")
}

function randomSuffix() {
  return crypto.randomBytes(3).toString("hex").toUpperCase()
}

function todayDateStr() {
  const now = new Date()
  return `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`
}

export async function generateNoStrukSimpanan() {
  const dateStr = todayDateStr()
  for (let attempt = 0; attempt < 10; attempt++) {
    const noStruk = `STR-${dateStr}-${randomSuffix()}`
    const existing = await prisma.transaksiSimpanan.findUnique({ where: { noStruk } })
    if (!existing) return noStruk
  }
  throw new Error("Gagal generate noStruk simpanan setelah 10 percobaan")
}

export async function generateNoStrukAngsuran() {
  const dateStr = todayDateStr()
  for (let attempt = 0; attempt < 10; attempt++) {
    const noStruk = `STR-${dateStr}-${randomSuffix()}`
    const existing = await prisma.angsuran.findFirst({ where: { noStruk } })
    if (!existing) return noStruk
  }
  throw new Error("Gagal generate noStruk angsuran setelah 10 percobaan")
}

export async function generateNoStrukTagihan() {
  const dateStr = todayDateStr()
  for (let attempt = 0; attempt < 10; attempt++) {
    const noStruk = `STR-${dateStr}-${randomSuffix()}`
    const existing = await prisma.tagihanSimpanan.findFirst({ where: { noStruk } })
    if (!existing) return noStruk
  }
  throw new Error("Gagal generate noStruk tagihan setelah 10 percobaan")
}
