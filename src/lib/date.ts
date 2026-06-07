/**
 * @file src/lib/date.ts
 * @description Fungsi pembantu (helper) untuk manipulasi tanggal dan penanganan timezone.
 */

const TZ_OFFSET = process.env.TZ_OFFSET ?? "+07:00"

export function getTZOffset(): string {
  return TZ_OFFSET
}

export function tahunRange(tahun: number) {
  return {
    gte: new Date(`${tahun}-01-01T00:00:00${TZ_OFFSET}`),
    lte: new Date(`${tahun}-12-31T23:59:59${TZ_OFFSET}`),
  }
}

export function hinggaAkhirTahun(tahun: number) {
  return { lte: new Date(`${tahun}-12-31T23:59:59${TZ_OFFSET}`) }
}

export function tahunMulai(tahun: number) {
  return new Date(`${tahun}-01-01T00:00:00${TZ_OFFSET}`)
}

export function tahunSelesai(tahun: number) {
  return new Date(`${tahun + 1}-01-01T00:00:00${TZ_OFFSET}`)
}
