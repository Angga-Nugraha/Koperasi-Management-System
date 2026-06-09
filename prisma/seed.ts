import "dotenv/config"
import { PrismaClient, AccountType, NormalBalance } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import bcrypt from "bcryptjs"

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

async function main() {
  console.log("🌱 Seeding database...")

  // ========== SEED COA (Chart of Accounts) ==========
  const coa: Array<{ kode: string; nama: string; tipe: AccountType; saldoNormal: NormalBalance }> = [
    // ASET (saldoNormal: DEBIT)
    { kode: "1.1.1", nama: "Kas", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.1.2", nama: "Bank", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.1.3", nama: "Bank BRI", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.1.4", nama: "Bank Mandiri", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.2.1", nama: "Piutang Pinjaman Anggota", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.2.2", nama: "Piutang Pinjaman Karyawan", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.2.3", nama: "Piutang Lain-lain", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.3.1", nama: "Perlengkapan Kantor", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.3.2", nama: "Peralatan Kantor", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.3.3", nama: "Akumulasi Penyusutan Peralatan", tipe: "ASET", saldoNormal: "KREDIT" },
    { kode: "1.3.4", nama: "Tanah", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.3.5", nama: "Gedung", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.3.6", nama: "Akumulasi Penyusutan Gedung", tipe: "ASET", saldoNormal: "KREDIT" },
    { kode: "1.4.1", nama: "Investasi Jangka Panjang", tipe: "ASET", saldoNormal: "DEBIT" },

    // LIABILITAS (saldoNormal: KREDIT)
    { kode: "2.1.1", nama: "Simpanan Pokok", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.1.2", nama: "Simpanan Wajib", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.1.3", nama: "Simpanan Sukarela", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.1", nama: "Dana Cadangan", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.2", nama: "Dana Sosial", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.3", nama: "Dana Pendidikan", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.4", nama: "Dana Pengurus", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.5", nama: "Dana Pengawas", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.3.1", nama: "Hutang Bank", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.3.2", nama: "Hutang Lain-lain", tipe: "LIABILITAS", saldoNormal: "KREDIT" },

    // EKUITAS (saldoNormal: KREDIT)
    { kode: "3.1.1", nama: "Modal Sumbangan", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.2", nama: "SHU Tahun Berjalan", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.3", nama: "SHU Ditahan", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.4", nama: "Cadangan SHU", tipe: "EKUITAS", saldoNormal: "KREDIT" },

    // PENDAPATAN (saldoNormal: KREDIT)
    { kode: "4.1.1", nama: "Pendapatan Jasa Pinjaman", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
    { kode: "4.1.2", nama: "Pendapatan Administrasi", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
    { kode: "4.1.3", nama: "Pendapatan Denda", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
    { kode: "4.1.4", nama: "Pendapatan Lain-lain", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },

    // BEBAN (saldoNormal: DEBIT)
    { kode: "5.1.1", nama: "Beban Gaji Karyawan", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.2", nama: "Beban Listrik & Air", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.3", nama: "Beban Telepon & Internet", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.4", nama: "Beban ATK & Perlengkapan", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.5", nama: "Beban Transportasi", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.6", nama: "Beban Rapat & Konsumsi", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.7", nama: "Beban Penyusutan", tipe: "BEBAN", saldoNormal: "DEBIT" },
    { kode: "5.1.8", nama: "Beban Lain-lain", tipe: "BEBAN", saldoNormal: "DEBIT" },
  ]

  for (const akun of coa) {
    await prisma.akun.upsert({
      where: { kode: akun.kode },
      update: akun,
      create: akun,
    })
  }
  console.log(`  ✅ ${coa.length} akun COA tersimpan`)

  // ========== SEED DEFAULT ADMIN ==========
  const adminEmail = "admin@simko.com"
  const adminPassword = await bcrypt.hash("admin123", 12)

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminPassword,
        role: "ADMIN",
        isActive: true,
      },
    })
    console.log("  ✅ Admin default: admin@simko.com / admin123 (ADMIN)")
  } else {
    if (existingAdmin.role !== "ADMIN") {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMIN" },
      })
      console.log("  🔄 Admin di-upgrade ke role ADMIN: admin@simko.com")
    } else {
      console.log("  ⏭️  Admin sudah ada, skip")
    }
  }

  // ========== SEED GENERAL INFO ==========
  await prisma.generalInfo.create({
    data: {
      namaKoperasi: "Koperasi Desa Merah Putih Cibunar",
      alamat: "Jln. Desa Cibunar No 2021 RT 014 RW 004 Desa Cibunar, Kec. Tarogong Kidul, Kab. Garut, 44151",
      noAhu: "AHU-0036770.AH.01.29.TAHUN 2025",
    },
  })
  console.log("  ✅ General info tersimpan")

  // ========== SEED JENIS SIMPANAN ==========
  const jenisSimpanan = [
    { kode: "POKOK", nama: "Simpanan Pokok", minimalSetoran: 25000, urutan: 1, keterangan: "Setoran sekali seumur keanggotaan" },
    { kode: "WAJIB", nama: "Simpanan Wajib", minimalSetoran: 10000, urutan: 2, keterangan: "Setoran wajib setiap bulan" },
    { kode: "SUKARELA", nama: "Simpanan Sukarela", minimalSetoran: 0, urutan: 3, keterangan: "Setoran sukareala kapan saja" },
  ]
  for (const js of jenisSimpanan) {
    await prisma.jenisSimpanan.upsert({
      where: { kode: js.kode },
      update: js,
      create: js,
    })
  }
  console.log(`  ✅ ${jenisSimpanan.length} jenis simpanan tersimpan`)

  // ========== SEED JENIS PINJAMAN ==========
  const jenisPinjaman = [
    { nama: "Konsumsi", bunga: 1.5, keterangan: "Pinjaman untuk kebutuhan konsumtif" },
    { nama: "Pendidikan", bunga: 1.0, keterangan: "Pinjaman untuk biaya pendidikan" },
    { nama: "Produktif", bunga: 2.0, keterangan: "Pinjaman untuk modal usaha" },
  ]
  for (const jp of jenisPinjaman) {
    await prisma.jenisPinjaman.upsert({
      where: { nama: jp.nama },
      update: jp,
      create: jp,
    })
  }
  console.log(`  ✅ ${jenisPinjaman.length} jenis pinjaman tersimpan`)

  // ========== SEED INDIKATOR SHU ==========
  const danaPengurus = await prisma.akun.findUnique({ where: { kode: "2.2.4" } })
  const danaPengawas = await prisma.akun.findUnique({ where: { kode: "2.2.5" } })
  const cadAkun = await prisma.akun.findUnique({ where: { kode: "2.2.1" } })
  const sosialAkun = await prisma.akun.findUnique({ where: { kode: "2.2.2" } })
  const danaPendidikan = await prisma.akun.findUnique({ where: { kode: "2.2.3" } })
  const jasaAnggota = await prisma.akun.findUnique({ where: { kode: "2.1.3" } })
  for (const ind of [
    { kode: "JM", nama: "Jasa Modal", persentase: 30, kelompok: "ANGGOTA", akunId: jasaAnggota?.id ?? null, urutan: 1 },
    { kode: "JU", nama: "Jasa Usaha", persentase: 30, kelompok: "ANGGOTA", akunId: jasaAnggota?.id ?? null, urutan: 2 },
    { kode: "CAD", nama: "Cadangan", persentase: 15, kelompok: "DANA", akunId: cadAkun?.id ?? null, urutan: 3 },
    { kode: "PENGURUS", nama: "Pengurus", persentase: 10, kelompok: "DANA", akunId: danaPengurus?.id ?? null, urutan: 4 },
    { kode: "PENGAWAS", nama: "Pengawas", persentase: 5, kelompok: "DANA", akunId: danaPengawas?.id ?? null, urutan: 5 },
    { kode: "SOSIAL", nama: "Dana Sosial", persentase: 5, kelompok: "DANA", akunId: sosialAkun?.id ?? null, urutan: 6 },
    { kode: "PENDIDIKAN", nama: "Dana Pendidikan", persentase: 5, kelompok: "DANA", akunId: danaPendidikan?.id ?? null, urutan: 7 },
  ]) {
    await prisma.indikatorSHU.upsert({ where: { kode: ind.kode }, update: ind, create: ind })
  }
  console.log("  IndikatorSHU: 6 indikator")

  // ========== SEED DEFAULT KONFIGURASI ==========
  // 1g. Konfigurasi
  for (const cfg of [
    { key: "plafon_max_saldo", value: "3", tipeData: "DECIMAL", keterangan: "Plafon maksimal pinjaman (kelipatan saldo simpanan)" },
    { key: "denda_per_hari", value: "0.01", tipeData: "DECIMAL", keterangan: "Denda keterlambatan per hari (%)" },
    { key: "grace_period", value: "7", tipeData: "NUMBER", keterangan: "Tenggang waktu keterlambatan (hari)" },
    { key: "tenor_min", value: "3", tipeData: "NUMBER", keterangan: "Tenor minimal pinjaman (bulan)" },
    { key: "tenor_max", value: "36", tipeData: "NUMBER", keterangan: "Tenor maksimal pinjaman (bulan)" },
  ]) {
    await prisma.konfigurasi.upsert({ where: { key: cfg.key }, update: cfg, create: cfg })
  }
  console.log("  Konfigurasi: 5 items")

  // ========== SEED KEPENGURUSAN ==========
  await prisma.kepengurusan.createMany({
    data: [
      { jabatan: "Ketua", tipe: "PENGURUS", urutan: 1 },
      { jabatan: "Sekretaris", tipe: "PENGURUS", urutan: 2 },
      { jabatan: "Bendahara", tipe: "PENGURUS", urutan: 3 },
      { jabatan: "Wakil Ketua Bidang Anggota", tipe: "PENGURUS", urutan: 4 },
      { jabatan: "Asisten Wakil Ketua Bidang Anggota", tipe: "PENGURUS", urutan: 5 },
      { jabatan: "Wakil Ketua Bidang Usaha", tipe: "PENGURUS", urutan: 6 },
      { jabatan: "Asisten Wakil Ketua Bidang Usaha", tipe: "PENGURUS", urutan: 7 },
      { jabatan: "Ketua Pengawas", tipe: "PENGAWAS", urutan: 8 },
      { jabatan: "Anggota Pengawas 1", tipe: "PENGAWAS", urutan: 9 },
      { jabatan: "Anggota Pengawas 2", tipe: "PENGAWAS", urutan: 10 },
    ],
    skipDuplicates: true,
  })
  console.log("  Kepengurusan: 10 posisi")

  console.log("🎉 Seeding selesai!")
}

main()
  .catch((e) => {
    console.error("❌ Seeding gagal:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
