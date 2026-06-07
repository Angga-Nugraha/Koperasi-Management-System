/**
 * @file src/lib/struk.ts
 * @description Generator nomor struk unik untuk transaksi simpanan, angsuran, dan tagihan.
 */

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

type NoStrukModel = "transaksiSimpanan" | "angsuran" | "tagihanSimpanan"

async function checkNoStrukExists(noStruk: string, model: NoStrukModel): Promise<boolean> {
  if (model === "transaksiSimpanan") {
    const existing = await prisma.transaksiSimpanan.findUnique({ where: { noStruk } })
    return !!existing
  }
  const existing = await (model === "angsuran"
    ? prisma.angsuran.findFirst({ where: { noStruk } })
    : prisma.tagihanSimpanan.findFirst({ where: { noStruk } }))
  return !!existing
}

export async function generateNoStruk(model: NoStrukModel) {
  const dateStr = todayDateStr()
  for (let attempt = 0; attempt < 10; attempt++) {
    const noStruk = `STR-${dateStr}-${randomSuffix()}`
    const exists = await checkNoStrukExists(noStruk, model)
    if (!exists) return noStruk
  }
  throw new Error(`Gagal generate noStruk ${model} setelah 10 percobaan`)
}

export const generateNoStrukSimpanan = () => generateNoStruk("transaksiSimpanan")
export const generateNoStrukAngsuran = () => generateNoStruk("angsuran")
export const generateNoStrukTagihan = () => generateNoStruk("tagihanSimpanan")
