import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { buatJurnal } from "../src/lib/jurnal"

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, ""),
  }
}

const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL ?? "")
const adapter = new PrismaMariaDb(dbConfig)
const prisma = new PrismaClient({ adapter })

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
const TAHUN = 2025

async function buatJurnalWrapper(
  params: { tanggal: Date; keterangan: string; entries: Array<{ akunKode: string; debit: number; kredit: number }>; dibuatOlehId: string }
) {
  await buatJurnal(prisma as any, {
    tanggal: params.tanggal,
    keterangan: params.keterangan,
    entries: params.entries,
    createdById: params.dibuatOlehId,
  })
}

async function main() {
  console.log("🗑️  Menghapus data transaksional...")
  await prisma.detailJurnal.deleteMany()
  await prisma.jurnalUmum.deleteMany()
  await prisma.angsuran.deleteMany()
  await prisma.pinjaman.deleteMany()
  await prisma.transaksiSimpanan.deleteMany()
  await prisma.simpanan.deleteMany()
  await prisma.alokasiSHU.deleteMany()
  await prisma.sHUAnggota.deleteMany()
  await prisma.sHU.deleteMany()
  await prisma.auditLog.deleteMany()
  console.log("  ✅ Data transaksional dihapus")

  const anggota = await prisma.anggota.findMany({ where: { status: "AKTIF" } })
  console.log(`  📋 ${anggota.length} anggota aktif`)

  const jenisPokok = await prisma.jenisSimpanan.findUnique({ where: { kode: "POKOK" } })
  const jenisWajib = await prisma.jenisSimpanan.findUnique({ where: { kode: "WAJIB" } })
  const jenisSukarela = await prisma.jenisSimpanan.findUnique({ where: { kode: "SUKARELA" } })
  if (!jenisPokok || !jenisWajib || !jenisSukarela) throw new Error("Jenis simpanan belum di-seed")

  const userBendahara = await prisma.user.findFirst({ where: { role: "BENDAHARA" } })
  if (!userBendahara) throw new Error("User bendahara tidak ditemukan")
  const dibuatOlehId = userBendahara.id

  // ========== SIMPANAN ==========
  for (let m = 1; m <= 12; m++) {
    const tgl = new Date(TAHUN, m - 1, Math.min(m * 3, 28))
    for (const a of anggota) {
      // Pokok (1x)
      if (m === 1) {
        await prisma.simpanan.upsert({
          where: { anggotaId_jenisSimpananId: { anggotaId: a.id, jenisSimpananId: jenisPokok.id } },
          create: { anggotaId: a.id, jenisSimpananId: jenisPokok.id, saldo: 100000 },
          update: {},
        })
        await prisma.transaksiSimpanan.create({
          data: {
            anggotaId: a.id, jenisSimpananId: jenisPokok.id,
            tipe: "SETORAN", nominal: 100000, saldoSetelah: 100000,
            keterangan: "Simpanan Pokok", createdAt: tgl, dibuatOlehId,
          },
        })
      }

      // Wajib (bulanan)
      const existingWajib = await prisma.simpanan.findUnique({
        where: { anggotaId_jenisSimpananId: { anggotaId: a.id, jenisSimpananId: jenisWajib.id } },
      })
      const saldoWajibLama = existingWajib ? Number(existingWajib.saldo) : 0
      await prisma.simpanan.upsert({
        where: { anggotaId_jenisSimpananId: { anggotaId: a.id, jenisSimpananId: jenisWajib.id } },
        create: { anggotaId: a.id, jenisSimpananId: jenisWajib.id, saldo: 50000 },
        update: { saldo: saldoWajibLama + 50000 },
      })
      await prisma.transaksiSimpanan.create({
        data: {
          anggotaId: a.id, jenisSimpananId: jenisWajib.id,
          tipe: "SETORAN", nominal: 50000, saldoSetelah: saldoWajibLama + 50000,
          keterangan: `Simpanan Wajib ${MONTHS[m-1]} ${TAHUN}`, createdAt: tgl, dibuatOlehId,
        },
      })

      // Sukarela (variatif)
      const sukaNominal = [0, 200000, 0, 150000, 0, 300000, 0, 100000, 0, 250000, 0, 100000][m - 1]
      if (sukaNominal > 0) {
        const existingSuka = await prisma.simpanan.findUnique({
          where: { anggotaId_jenisSimpananId: { anggotaId: a.id, jenisSimpananId: jenisSukarela.id } },
        })
        const saldoLama = existingSuka ? Number(existingSuka.saldo) : 0
        await prisma.simpanan.upsert({
          where: { anggotaId_jenisSimpananId: { anggotaId: a.id, jenisSimpananId: jenisSukarela.id } },
          create: { anggotaId: a.id, jenisSimpananId: jenisSukarela.id, saldo: sukaNominal },
          update: { saldo: saldoLama + sukaNominal },
        })
        await prisma.transaksiSimpanan.create({
          data: {
            anggotaId: a.id, jenisSimpananId: jenisSukarela.id,
            tipe: "SETORAN", nominal: sukaNominal, saldoSetelah: saldoLama + sukaNominal,
            keterangan: "Simpanan Sukarela", createdAt: tgl, dibuatOlehId,
          },
        })
      }
    }
  }
  console.log("  ✅ Simpanan 2025")

  // ========== JURNAL SIMPANAN (gabung per bulan) ==========
  const sukaBulanan: Record<number, number> = { 1: 200000, 3: 150000, 5: 300000, 7: 100000, 9: 250000, 11: 100000 }
  for (let m = 1; m <= 12; m++) {
    const tgl = new Date(TAHUN, m - 1, Math.min(m * 3, 28))
    const entries: Array<{ akunKode: string; debit: number; kredit: number }> = []

    // Pokok (Jan)
    if (m === 1) {
      for (const _ of anggota) {
        entries.push({ akunKode: "1.1.1", debit: 100000, kredit: 0 })
        entries.push({ akunKode: "2.1.1", debit: 0, kredit: 100000 })
      }
    }

    // Wajib
    for (const _ of anggota) {
      entries.push({ akunKode: "1.1.1", debit: 50000, kredit: 0 })
      entries.push({ akunKode: "2.1.2", debit: 0, kredit: 50000 })
    }

    // Sukarela
    const sukaNom = sukaBulanan[m - 1]
    if (sukaNom) {
      for (const _ of anggota) {
        entries.push({ akunKode: "1.1.1", debit: sukaNom, kredit: 0 })
        entries.push({ akunKode: "2.1.3", debit: 0, kredit: sukaNom })
      }
    }

    await buatJurnalWrapper({
      tanggal: tgl,
      keterangan: `Simpanan ${MONTHS[m-1]} ${TAHUN}`,
      entries,
      dibuatOlehId,
    })
  }
  console.log("  ✅ Jurnal simpanan")

  // ========== PINJAMAN ==========
  const jenisKonsumsi = await prisma.jenisPinjaman.findUnique({ where: { nama: "Konsumsi" } })
  const jenisPendidikan = await prisma.jenisPinjaman.findUnique({ where: { nama: "Pendidikan" } })
  const jenisProduktif = await prisma.jenisPinjaman.findUnique({ where: { nama: "Produktif" } })

  const pinjamanData = [
    { anggota: anggota[0], jenis: jenisKonsumsi!, jumlah: 5000000, tenor: 6, tgl: new Date(TAHUN, 0, 15) },
    { anggota: anggota[1], jenis: jenisProduktif!, jumlah: 20000000, tenor: 12, tgl: new Date(TAHUN, 0, 10) },
    { anggota: anggota[2], jenis: jenisPendidikan!, jumlah: 10000000, tenor: 12, tgl: new Date(TAHUN, 8, 1) },
    { anggota: anggota[3], jenis: jenisKonsumsi!, jumlah: 4000000, tenor: 6, tgl: new Date(TAHUN, 5, 20) },
  ]

  for (let pi = 0; pi < pinjamanData.length; pi++) {
    const p = pinjamanData[pi]
    const bungaBln = Number(p.jenis.bunga) / 100
    const angsuranPokok = Math.floor(p.jumlah / p.tenor)
    const angsuranPokokTerakhir = p.jumlah - angsuranPokok * (p.tenor - 1)
    const angsuranJasa = Math.round(p.jumlah * bungaBln)
    const angsuranTotal = angsuranPokok + angsuranJasa

    const pinjaman = await prisma.pinjaman.create({
      data: {
        anggotaId: p.anggota.id, jenisPinjamanId: p.jenis.id,
        jumlah: p.jumlah, tenor: p.tenor, bunga: Number(p.jenis.bunga),
        angsuranPokok, angsuranJasa, angsuranTotal,
        sisaPinjaman: p.jumlah, status: "DICAIKKAN",
        tglPengajuan: p.tgl, tglDisetujui: p.tgl, tglCair: p.tgl,
        keterangan: `Pinjaman ${p.jenis.nama} - ${p.anggota.nama}`,
        disetujuiOlehId: dibuatOlehId,
      },
    })

    await buatJurnalWrapper({
      tanggal: p.tgl,
      keterangan: `Pencairan Pinjaman ${pinjaman.id.substring(0,8)}`,
      entries: [
        { akunKode: "1.2.1", debit: p.jumlah, kredit: 0 },
        { akunKode: "1.1.1", debit: 0, kredit: p.jumlah },
      ],
      dibuatOlehId: dibuatOlehId,
    })

    let totalPokokDibayar = 0

    for (let a = 1; a <= p.tenor; a++) {
      const jatuhTempo = new Date(p.tgl)
      jatuhTempo.setMonth(jatuhTempo.getMonth() + a)

      let status: "LUNAS" | "BELUM_LUNAS" | "TERLAMBAT" = "BELUM_LUNAS"
      let tglBayar: Date | null = null
      let denda = 0

      // Skenario per pinjaman
      if (pi === 0) {
        // Ali (Konsumsi 5jt, Jan, 6bln) — LUNAS semua, tepat waktu
        if (jatuhTempo <= new Date(TAHUN, 11, 31)) {
          status = "LUNAS"
          tglBayar = new Date(jatuhTempo)
        }
      } else if (pi === 1) {
        // Budi (Produktif 20jt, Jan, 12bln) — LUNAS semua (2-12)
        // a=1 (Feb) .. a=11 (Des) di 2025, a=12 (Jan) di 2026
        if (jatuhTempo <= new Date(TAHUN + 1, 0, 31)) {
          status = "LUNAS"
          tglBayar = new Date(jatuhTempo)
        }
      } else if (pi === 2) {
        // Citra (Pendidikan 10jt, Sep, 12bln) — masih berjalan
        // a=1-7 (Okt-Apr) LUNAS, a=8 (Mei) TERLAMBAT
        if (a <= 7) {
          status = "LUNAS"
          tglBayar = new Date(jatuhTempo)
        } else if (a === 8) {
          status = "TERLAMBAT"
          tglBayar = new Date(jatuhTempo)
          tglBayar.setDate(tglBayar.getDate() + 15)
          denda = Math.round(angsuranTotal * 0.005)
        }
      } else if (pi === 3) {
        // Dewi (Konsumsi 4jt, Jun, 6bln) — LUNAS semua
        if (jatuhTempo <= new Date(TAHUN, 11, 31)) {
          status = "LUNAS"
          tglBayar = new Date(jatuhTempo)
        }
      }

      const pokokAktual = a === p.tenor ? angsuranPokokTerakhir : angsuranPokok

      await prisma.angsuran.create({
        data: {
          pinjamanId: pinjaman.id, angsuranKe: a,
          jatuhTempo, tglBayar,
          pokok: pokokAktual, jasa: angsuranJasa,
          denda,
          total: angsuranTotal + (status === "TERLAMBAT" ? denda : 0),
          status,
        },
      })

      if (status === "LUNAS" || status === "TERLAMBAT") {
        totalPokokDibayar += pokokAktual
        const dendaNominal = status === "TERLAMBAT" ? denda : 0
        await buatJurnalWrapper({
          tanggal: tglBayar,
          keterangan: `Angsuran ${pinjaman.id.substring(0,8)} ke-${a}${dendaNominal > 0 ? " (telat)" : ""}`,
          entries: [
            { akunKode: "1.1.1", debit: angsuranTotal + dendaNominal, kredit: 0 },
            { akunKode: "1.2.1", debit: 0, kredit: pokokAktual },
            { akunKode: "4.1.1", debit: 0, kredit: angsuranJasa },
            ...(dendaNominal > 0 ? [{ akunKode: "4.1.3", debit: 0, kredit: dendaNominal }] : []),
          ],
          dibuatOlehId: dibuatOlehId,
        })
      }
    }

    const sisa = Math.max(0, p.jumlah - totalPokokDibayar)
    const loanStatus = sisa <= angsuranPokok ? "LUNAS" : "DICAIKKAN"
    await prisma.pinjaman.update({
      where: { id: pinjaman.id },
      data: { sisaPinjaman: loanStatus === "LUNAS" ? 0 : sisa, status: loanStatus },
    })
  }
  console.log("  ✅ Pinjaman + Angsuran")

  // ========== JURNAL BEBAN OPERASIONAL ==========
  const beban = [
    { kode: "5.1.1", nominal: 400000, label: "Gaji Karyawan" },
    { kode: "5.1.2", nominal: 100000, label: "Listrik & Air" },
    { kode: "5.1.4", nominal: 50000, label: "ATK & Perlengkapan" },
    { kode: "5.1.8", nominal: 50000, label: "Transportasi" },
  ]
  for (let m = 1; m <= 12; m++) {
    const tgl = new Date(TAHUN, m - 1, Math.min(m * 2 + 5, 28))
    for (const b of beban) {
      await buatJurnalWrapper({
        tanggal: tgl,
        keterangan: `${b.label} ${MONTHS[m-1]} ${TAHUN}`,
        entries: [
          { akunKode: b.kode, debit: b.nominal, kredit: 0 },
          { akunKode: "1.1.1", debit: 0, kredit: b.nominal },
        ],
        dibuatOlehId: dibuatOlehId,
      })
    }
  }
  console.log("  ✅ Beban operasional")

  // ========== JURNAL PENDAPATAN ADMIN ==========
  for (let m = 1; m <= 12; m++) {
    await buatJurnalWrapper({
      tanggal: new Date(TAHUN, m - 1, 15),
      keterangan: `Pendapatan Administrasi ${MONTHS[m-1]} ${TAHUN}`,
      entries: [
        { akunKode: "1.1.1", debit: 300000, kredit: 0 },
        { akunKode: "4.1.2", debit: 0, kredit: 300000 },
      ],
      dibuatOlehId,
    })
  }
  console.log("  ✅ Pendapatan administrasi")

  // ========== JURNAL PENDAPATAN LAIN ==========
  await buatJurnalWrapper({
    tanggal: new Date(TAHUN, 5, 30),
    keterangan: "Pendapatan Denda Keterlambatan",
    entries: [
      { akunKode: "1.1.1", debit: 150000, kredit: 0 },
      { akunKode: "4.1.3", debit: 0, kredit: 150000 },
    ],
    dibuatOlehId,
  })
  console.log("  ✅ Pendapatan lain-lain")

  // ========== GENERATE SHU 2025 ==========
  console.log("\n📊 Menghitung SHU 2025...")
  const { hitungSHU } = await import("../src/lib/shu")
  const hasil = await hitungSHU(TAHUN)

  const indikator = await prisma.indikatorSHU.findMany({ orderBy: { urutan: "asc" } })
  await prisma.sHU.create({
    data: {
      tahun: TAHUN,
      totalSHU: hasil.keuangan.totalSHU,
      status: "DRAFT",
      alokasi: {
        create: indikator.map((i) => ({
          indikatorId: i.id,
          pos: i.kode,
          persentase: Number(i.persentase),
          nominal: hasil.alokasi[i.kode]?.nominal ?? 0,
        })),
      },
      shuAnggota: {
        create: hasil.perAnggota.map((a) => ({
          anggotaId: a.anggotaId,
          jasaModal: a.jasaModal,
          jasaUsaha: a.jasaUsaha,
          total: a.total,
        })),
      },
    },
  })
  console.log("  ✅ SHU 2025 DRAFT")

  // SUMMARY
  const jmlJurnal = await prisma.jurnalUmum.count()
  const jmlDetail = await prisma.detailJurnal.count()
  const jmlTrans = await prisma.transaksiSimpanan.count()
  const jmlAngsur = await prisma.angsuran.count()

  console.log(`\n📋 Ringkasan data ${TAHUN}:`)
  console.log(`  Jurnal: ${jmlJurnal} (${jmlDetail} detail)`)
  console.log(`  Transaksi Simpanan: ${jmlTrans}`)
  console.log(`  Angsuran: ${jmlAngsur}`)
  console.log(`  SHU: Rp ${hasil.keuangan.totalSHU.toLocaleString("id-ID")} (DRAFT)`)
  console.log(`  Anggota: ${hasil.totalAnggota}`)
  console.log(`\n✅ Siap untuk testing!`)
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
