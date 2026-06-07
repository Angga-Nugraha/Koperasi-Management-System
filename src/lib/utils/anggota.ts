/**
 * @file src/lib/utils/anggota.ts
 * @description Generator nomor anggota dengan format unik dan suffix acak.
 */

import crypto from "crypto"

export function generateNoAnggota(tglMasuk: Date, urutan: number) {
  const yy = tglMasuk.getFullYear().toString().slice(-2)
  const mm = (tglMasuk.getMonth() + 1).toString().padStart(2, "0")
  const dd = tglMasuk.getDate().toString().padStart(2, "0")
  const nomor = urutan.toString().padStart(4, "0")
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase()
  return `AGT${yy}${mm}${dd}${nomor}-${suffix}`
}
