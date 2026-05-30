export function generateNoAnggota(tglMasuk: Date, urutan: number) {
  const yy = tglMasuk.getFullYear().toString().slice(-2)
  const mm = (tglMasuk.getMonth() + 1).toString().padStart(2, "0")
  const dd = tglMasuk.getDate().toString().padStart(2, "0")
  const nomor = urutan.toString().padStart(4, "0")
  return `AGT${yy}${mm}${dd}${nomor}`
}
