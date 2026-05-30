import { prisma } from "@/lib/prisma"

type KonfigAlokasi = {
  jmPersen: number
  juPersen: number
  cadPersen: number
  pengurusPersen: number
  pengawasPersen: number
  sosialPersen: number
}

const DEFAULT_ALOKASI: KonfigAlokasi = {
  jmPersen: 30,
  juPersen: 30,
  cadPersen: 15,
  pengurusPersen: 10,
  pengawasPersen: 5,
  sosialPersen: 10,
}

const KEY_MAP: Record<keyof KonfigAlokasi, string> = {
  jmPersen: "alokasi_jm",
  juPersen: "alokasi_ju",
  cadPersen: "alokasi_cad",
  pengurusPersen: "alokasi_pengurus",
  pengawasPersen: "alokasi_pengawas",
  sosialPersen: "alokasi_sosial",
}

const FIELD_MAP: Record<string, keyof KonfigAlokasi> = {
  alokasi_jm: "jmPersen",
  alokasi_ju: "juPersen",
  alokasi_cad: "cadPersen",
  alokasi_pengurus: "pengurusPersen",
  alokasi_pengawas: "pengawasPersen",
  alokasi_sosial: "sosialPersen",
}

export async function getAlokasiConfig(): Promise<KonfigAlokasi> {
  const rows = await prisma.konfigurasi.findMany({
    where: { key: { startsWith: "alokasi_" } },
  })
  if (rows.length === 0) return DEFAULT_ALOKASI

  const map = new Map(rows.map((r) => [r.key, r.value]))
  const result = { ...DEFAULT_ALOKASI }
  for (const [key, field] of Object.entries(FIELD_MAP)) {
    const val = map.get(key)
    if (val) result[field] = Number(val)
  }
  return result
}

export async function saveAlokasiConfig(data: KonfigAlokasi) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (Math.abs(total - 100) > 0.01) throw new Error("Total persentase harus 100%")

  for (const [field, key] of Object.entries(KEY_MAP)) {
    const val = data[field as keyof KonfigAlokasi]
    const labels: Record<string, string> = {
      jmPersen: "Jasa Modal (%)",
      juPersen: "Jasa Usaha (%)",
      cadPersen: "Cadangan (%)",
      pengurusPersen: "Pengurus (%)",
      pengawasPersen: "Pengawas (%)",
      sosialPersen: "Pendidikan & Sosial (%)",
    }
    await prisma.konfigurasi.upsert({
      where: { key },
      create: { key, value: String(val), tipeData: "DECIMAL", keterangan: labels[field] ?? "" },
      update: { value: String(val) },
    })
  }
}

export async function getTotalPendapatanBeban(tahun: number) {
  const mulai = new Date(`${tahun}-01-01T00:00:00+07:00`)
  const selesai = new Date(`${tahun + 1}-01-01T00:00:00+07:00`)

  const detail = await prisma.detailJurnal.findMany({
    where: {
      jurnal: {
        tanggal: { gte: mulai, lt: selesai },
      },
    },
    include: { akun: true },
  })

  let totalPendapatan = 0
  let totalBeban = 0

  for (const d of detail) {
    if (d.akun.tipe === "PENDAPATAN") {
      totalPendapatan += Number(d.kredit) - Number(d.debit)
    }
    if (d.akun.tipe === "BEBAN") {
      totalBeban += Number(d.debit) - Number(d.kredit)
    }
  }

  return {
    totalPendapatan: Math.round(totalPendapatan * 100) / 100,
    totalBeban: Math.round(totalBeban * 100) / 100,
    totalSHU: Math.round((totalPendapatan - totalBeban) * 100) / 100,
  }
}

export async function getSaldoPerAnggota() {
  const simpanan = await prisma.simpanan.findMany({
    select: { anggotaId: true, saldo: true },
  })

  const perAnggota = new Map<string, number>()
  for (const s of simpanan) {
    perAnggota.set(s.anggotaId, (perAnggota.get(s.anggotaId) ?? 0) + Number(s.saldo))
  }

  let total = 0
  for (const v of perAnggota.values()) total += v

  return { perAnggota, totalSimpanan: Math.round(total * 100) / 100 }
}

export async function getTotalAngsuranAnggota(tahun: number) {
  const mulai = new Date(`${tahun}-01-01T00:00:00+07:00`)
  const selesai = new Date(`${tahun + 1}-01-01T00:00:00+07:00`)

  const angsuran = await prisma.angsuran.findMany({
    where: {
      tglBayar: { gte: mulai, lt: selesai },
      status: "LUNAS",
    },
    include: {
      pinjaman: { select: { anggotaId: true } },
    },
  })

  const perAnggota = new Map<string, number>()
  for (const a of angsuran) {
    const id = a.pinjaman.anggotaId
    perAnggota.set(id, (perAnggota.get(id) ?? 0) + Number(a.pokok))
  }

  let total = 0
  for (const v of perAnggota.values()) total += v

  return { perAnggota, total: Math.round(total * 100) / 100 }
}

export async function hitungSHU(tahun: number) {
  const keuangan = await getTotalPendapatanBeban(tahun)
  if (keuangan.totalSHU <= 0) {
    throw new Error("SHU tidak bisa dihitung karena laba bersih <= 0")
  }

  const alokasi = await getAlokasiConfig()
  const { totalSimpanan, perAnggota: saldoPerAnggota } = await getSaldoPerAnggota()
  const totalAngsuran = await getTotalAngsuranAnggota(tahun)

  const jmDana = keuangan.totalSHU * (alokasi.jmPersen / 100)
  const juDana = keuangan.totalSHU * (alokasi.juPersen / 100)
  const cadDana = keuangan.totalSHU * (alokasi.cadPersen / 100)
  const pengurusDana = keuangan.totalSHU * (alokasi.pengurusPersen / 100)
  const pengawasDana = keuangan.totalSHU * (alokasi.pengawasPersen / 100)
  const sosialDana = keuangan.totalSHU * (alokasi.sosialPersen / 100)

  const anggotaList = await prisma.anggota.findMany({
    where: { status: "AKTIF" },
    select: { id: true, nama: true, noAnggota: true },
  })

  const perAnggota: Array<{
    anggotaId: string
    noAnggota: string
    nama: string
    jasaModal: number
    jasaUsaha: number
    total: number
  }> = []

  for (const anggota of anggotaList) {
    const saldo = saldoPerAnggota.get(anggota.id) ?? 0
    const angsuranPokok = totalAngsuran.perAnggota.get(anggota.id) ?? 0

    const jm = totalSimpanan > 0 ? jmDana * (saldo / totalSimpanan) : 0
    const ju = totalAngsuran.total > 0 ? juDana * (angsuranPokok / totalAngsuran.total) : 0
    const total = Math.round((jm + ju) * 100) / 100

    perAnggota.push({
      anggotaId: anggota.id,
      noAnggota: anggota.noAnggota,
      nama: anggota.nama,
      jasaModal: Math.round(jm * 100) / 100,
      jasaUsaha: Math.round(ju * 100) / 100,
      total,
    })
  }

  return {
    keuangan,
    alokasi: {
      jmPersen: alokasi.jmPersen,
      juPersen: alokasi.juPersen,
      cadPersen: alokasi.cadPersen,
      pengurusPersen: alokasi.pengurusPersen,
      pengawasPersen: alokasi.pengawasPersen,
      sosialPersen: alokasi.sosialPersen,
      jmDana: Math.round(jmDana * 100) / 100,
      juDana: Math.round(juDana * 100) / 100,
      cadDana: Math.round(cadDana * 100) / 100,
      pengurusDana: Math.round(pengurusDana * 100) / 100,
      pengawasDana: Math.round(pengawasDana * 100) / 100,
      sosialDana: Math.round(sosialDana * 100) / 100,
    },
    perAnggota,
    totalAnggota: anggotaList.length,
  }
}
