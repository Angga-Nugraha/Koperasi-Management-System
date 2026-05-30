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
    { kode: "1.1.2", nama: "Bank BRI", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.1.3", nama: "Bank BNI", tipe: "ASET", saldoNormal: "DEBIT" },
    { kode: "1.1.4", nama: "Bank Syariah", tipe: "ASET", saldoNormal: "DEBIT" },
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
        role: "PENGURUS",
        isActive: true,
      },
    })
    console.log("  ✅ Admin default: admin@simko.com / admin123")
  } else {
    console.log("  ⏭️  Admin sudah ada, skip")
  }

  // ========== SEED DEFAULT KONFIGURASI ==========
  const konfigurasi = [
    { key: "plafon_max_saldo", value: "3", tipeData: "DECIMAL", keterangan: "Plafon maksimal pinjaman (kelipatan saldo simpanan)" },
    { key: "denda_per_hari", value: "0.5", tipeData: "DECIMAL", keterangan: "Denda keterlambatan per hari (%)" },
    { key: "grace_period", value: "7", tipeData: "NUMBER", keterangan: "Tenggang waktu keterlambatan (hari)" },
    { key: "tenor_min", value: "3", tipeData: "NUMBER", keterangan: "Tenor minimal pinjaman (bulan)" },
    { key: "tenor_max", value: "36", tipeData: "NUMBER", keterangan: "Tenor maksimal pinjaman (bulan)" },
    { key: "alokasi_jm", value: "30", tipeData: "DECIMAL", keterangan: "Alokasi SHU untuk Jasa Modal (%)" },
    { key: "alokasi_ju", value: "30", tipeData: "DECIMAL", keterangan: "Alokasi SHU untuk Jasa Usaha (%)" },
    { key: "alokasi_cad", value: "15", tipeData: "DECIMAL", keterangan: "Alokasi SHU untuk Cadangan (%)" },
    { key: "alokasi_pengurus", value: "10", tipeData: "DECIMAL", keterangan: "Alokasi SHU untuk Pengurus (%)" },
    { key: "alokasi_pengawas", value: "5", tipeData: "DECIMAL", keterangan: "Alokasi SHU untuk Pengawas (%)" },
    { key: "alokasi_sosial", value: "10", tipeData: "DECIMAL", keterangan: "Alokasi SHU untuk Dana Sosial & Pendidikan (%)" },
    { key: "no_ahu", value: "", tipeData: "STRING", keterangan: "Nomor AHU (badan hukum)" },
    { key: "nama_koperasi", value: "Koperasi Dharma Mitra Persada", tipeData: "STRING", keterangan: "Nama koperasi" },
    { key: "alamat_koperasi", value: "Cibinong, Bogor", tipeData: "STRING", keterangan: "Alamat koperasi" },
    { key: "simpanan_pokok", value: "100000", tipeData: "DECIMAL", keterangan: "Nominal simpanan pokok (sekali)" },
    { key: "simpanan_wajib_perbulan", value: "50000", tipeData: "DECIMAL", keterangan: "Nominal simpanan wajib per bulan" },
    { key: "simpanan_wajib_tgl_jatuh_tempo", value: "10", tipeData: "NUMBER", keterangan: "Tanggal jatuh tempo simpanan wajib" },
  ]

  for (const cfg of konfigurasi) {
    await prisma.konfigurasi.upsert({
      where: { key: cfg.key },
      update: cfg,
      create: cfg,
    })
  }
  console.log(`  ✅ ${konfigurasi.length} konfigurasi default tersimpan`)

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
