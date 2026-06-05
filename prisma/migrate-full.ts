import "dotenv/config"
import { PrismaClient, AccountType, NormalBalance } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import fs from "fs"
import path from "path"

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

const AKUN_MAP: Record<string, string> = {
  "Kas": "1.1.1", "Simpanan Pokok": "2.1.1", "Simpanan Wajib": "2.1.2", "Simpanan Sukarela": "2.1.3",
  "ATK dan Perlengkapan Kantor": "5.1.4", "Transportasi": "5.1.5",
}

type AnggotaRaw = { nama: string; NIK: string; alamat: string; jenisKelamin: string; pekerjaan: string; noHp: string; tglMasuk: string }
type JurnalRaw = { tanggal: string; keterangan: string; nama_anggota: string | null; nama_akun: string; debit: number | null; kredit: number | null; nik?: string }

async function main() {
  console.log("=== MIGRASI LENGKAP ===\n")

  // ========== 1. SEED REFERENCE DATA ==========
  console.log("1. Seeding reference data...")

  // 1a. COA
  const coa: Array<{ kode: string; nama: string; tipe: AccountType; saldoNormal: NormalBalance }> = [
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
    { kode: "2.1.1", nama: "Simpanan Pokok", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.1.2", nama: "Simpanan Wajib", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.1.3", nama: "Simpanan Sukarela", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.1.4", nama: "Dana Jasa Modal", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.1", nama: "Dana Cadangan", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.2", nama: "Dana Sosial", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.2.3", nama: "Dana Pendidikan", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.3.1", nama: "Hutang Bank", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "2.3.2", nama: "Hutang Lain-lain", tipe: "LIABILITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.1", nama: "Modal Sumbangan", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.2", nama: "SHU Tahun Berjalan", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.3", nama: "SHU Ditahan", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "3.1.4", nama: "Cadangan SHU", tipe: "EKUITAS", saldoNormal: "KREDIT" },
    { kode: "4.1.1", nama: "Pendapatan Jasa Pinjaman", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
    { kode: "4.1.2", nama: "Pendapatan Administrasi", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
    { kode: "4.1.3", nama: "Pendapatan Denda", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
    { kode: "4.1.4", nama: "Pendapatan Lain-lain", tipe: "PENDAPATAN", saldoNormal: "KREDIT" },
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
  console.log(`  COA: ${coa.length} akun`)

  // 1b. Admin user
  const adminEmail = "admin@simko.com"
  const adminPassword = await bcrypt.hash("admin123", 12)
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: { email: adminEmail, passwordHash: adminPassword, role: "ADMIN", isActive: true },
    })
    console.log("  Admin: created")
  } else {
    if (adminUser.role !== "ADMIN") {
      adminUser = await prisma.user.update({ where: { email: adminEmail }, data: { role: "ADMIN" } })
    }
    console.log("  Admin: already exists")
  }

  // 1c. GeneralInfo
  const existingGI = await prisma.generalInfo.findFirst()
  if (!existingGI) {
    await prisma.generalInfo.create({
      data: {
        namaKoperasi: "Koperasi Desa Merah Putih Cibunar",
        alamat: "Jln. Desa Cibunar No 2021 RT 014 RW 004 Desa Cibunar, Kec. Tarogong Kidul, Kab. Garut, 44151",
        noAhu: "AHU-0036770.AH.01.29.TAHUN 2025",
      },
    })
  }
  console.log("  GeneralInfo: ready")

  // 1d. JenisSimpanan
  for (const js of [
    { kode: "POKOK", nama: "Simpanan Pokok", minimalSetoran: 25000, urutan: 1, keterangan: "Setoran sekali seumur keanggotaan" },
    { kode: "WAJIB", nama: "Simpanan Wajib", minimalSetoran: 10000, urutan: 2, keterangan: "Setoran wajib setiap bulan" },
    { kode: "SUKARELA", nama: "Simpanan Sukarela", minimalSetoran: 0, urutan: 3, keterangan: "Setoran sukarela kapan saja" },
  ]) {
    await prisma.jenisSimpanan.upsert({ where: { kode: js.kode }, update: js, create: js })
  }
  console.log("  JenisSimpanan: 3 jenis")

  // 1e. JenisPinjaman
  for (const jp of [
    { nama: "Konsumsi", bunga: 1.5, keterangan: "Pinjaman untuk kebutuhan konsumtif" },
    { nama: "Pendidikan", bunga: 1.0, keterangan: "Pinjaman untuk biaya pendidikan" },
    { nama: "Produktif", bunga: 2.0, keterangan: "Pinjaman untuk modal usaha" },
  ]) {
    await prisma.jenisPinjaman.upsert({ where: { nama: jp.nama }, update: jp, create: jp })
  }
  console.log("  JenisPinjaman: 3 jenis")

  // 1f. IndikatorSHU
  const shuAkun = await prisma.akun.findUnique({ where: { kode: "3.1.3" } })
  const cadAkun = await prisma.akun.findUnique({ where: { kode: "2.2.1" } })
  const sosialAkun = await prisma.akun.findUnique({ where: { kode: "2.2.2" } })
  const jasaModalAkun = await prisma.akun.findUnique({ where: { kode: "2.1.4" } })
  for (const ind of [
    { kode: "JM", nama: "Jasa Modal", persentase: 30, kelompok: "ANGGOTA", akunId: jasaModalAkun?.id ?? null, urutan: 1 },
    { kode: "JU", nama: "Jasa Usaha", persentase: 30, kelompok: "ANGGOTA", akunId: null, urutan: 2 },
    { kode: "CAD", nama: "Cadangan", persentase: 15, kelompok: "DANA", akunId: cadAkun?.id ?? null, urutan: 3 },
    { kode: "PENGURUS", nama: "Pengurus", persentase: 10, kelompok: "DANA", akunId: shuAkun?.id ?? null, urutan: 4 },
    { kode: "PENGAWAS", nama: "Pengawas", persentase: 5, kelompok: "DANA", akunId: shuAkun?.id ?? null, urutan: 5 },
    { kode: "SOSIAL", nama: "Dana Sosial & Pendidikan", persentase: 10, kelompok: "DANA", akunId: sosialAkun?.id ?? null, urutan: 6 },
  ]) {
    await prisma.indikatorSHU.upsert({ where: { kode: ind.kode }, update: ind, create: ind })
  }
  console.log("  IndikatorSHU: 6 indikator")

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

  // ========== 2. IMPORT MEMBERS ==========
  console.log("\n2. Importing members...")
  const anggotaData: AnggotaRaw[] = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "anggota.json"), "utf-8"))
  const jurnalData: JurnalRaw[] = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "jurnal.json"), "utf-8"))

  // Sort by tglMasuk then nama
  anggotaData.sort((a, b) => {
    if (a.tglMasuk !== b.tglMasuk) {
      if (!a.tglMasuk) return 1
      if (!b.tglMasuk) return -1
      return a.tglMasuk.localeCompare(b.tglMasuk)
    }
    return a.nama.localeCompare(b.nama)
  })

  // Build name→members map (for duplicate handling)
  const nameToMembers = new Map<string, Array<{ nama: string; NIK: string; tglMasuk: string }>>()
  for (const m of anggotaData) {
    if (!nameToMembers.has(m.nama)) nameToMembers.set(m.nama, [])
    nameToMembers.get(m.nama)!.push(m)
  }

  const memberIdByNameNik = new Map<string, string>() // "name|nik" → anggotaId
  const memberIdByName = new Map<string, string>() // name → anggotaId (last created)
  const memberIdMap = new Map<string, string>() // anggota.noAnggota → anggotaId
  let memberCount = 0
  let seq = 1

  for (const m of anggotaData) {
    const tglMasuk = m.tglMasuk ? new Date(m.tglMasuk + "T00:00:00+07:00") : new Date()
    const datePart = `${String(tglMasuk.getFullYear()).slice(-2)}${String(tglMasuk.getMonth() + 1).padStart(2, "0")}${String(tglMasuk.getDate()).padStart(2, "0")}`
    const noAnggota = `AGT${datePart}${String(seq).padStart(4, "0")}`
    seq++

    const nik = m.NIK || noAnggota

    const anggota = await prisma.anggota.create({
      data: {
        noAnggota,
        nik,
        nama: m.nama,
        noHp: m.noHp || null,
        jenisKelamin: m.jenisKelamin || null,
        alamat: m.alamat || "-",
        pekerjaan: m.pekerjaan || null,
        tglMasuk,
        status: "AKTIF",
      },
    })

    const passwordHash = await bcrypt.hash(m.nama.toLowerCase().replace(/\s+/g, ""), 12)
    await prisma.user.create({
      data: { email: `${noAnggota}@anggota.simko.com`, passwordHash, role: "ANGGOTA", anggotaId: anggota.id },
    })

    memberIdByNameNik.set(`${m.nama}|${nik}`, anggota.id)
    memberIdByName.set(m.nama, anggota.id)
    memberIdMap.set(noAnggota, anggota.id)
    memberCount++
  }
  console.log(`  ${memberCount} members created`)

  // ========== 3. IMPORT JOURNALS ==========
  console.log("\n3. Importing journal entries...")

  const byTanggal = new Map<string, JurnalRaw[]>()
  for (const e of jurnalData) {
    if (!byTanggal.has(e.tanggal)) byTanggal.set(e.tanggal, [])
    byTanggal.get(e.tanggal)!.push(e)
  }

  const akunList = await prisma.akun.findMany()
  const akunMap = new Map(akunList.map((a) => [a.kode, a.id]))
  const jenisSimpananMap = new Map<string, string>()
  for (const js of await prisma.jenisSimpanan.findMany()) {
    jenisSimpananMap.set(js.kode, js.id)
  }

  let totalJurnal = 0
  let totalLines = 0

  for (const [tgl, dayEntries] of byTanggal) {
    const tglDate = new Date(tgl + "T00:00:00+07:00")

    // Aggregate account balances
    const accountBalances = new Map<string, number>()
    const memberSavings = new Map<string, { pokok: number; wajib: number; sukarela: number; nik?: string }>()

    for (const e of dayEntries) {
      const debit = e.debit ?? 0
      const kredit = e.kredit ?? 0
      const current = accountBalances.get(e.nama_akun) ?? 0
      accountBalances.set(e.nama_akun, current + kredit - debit)

      if (e.nama_anggota && ["Simpanan Pokok", "Simpanan Wajib", "Simpanan Sukarela"].includes(e.nama_akun)) {
        const key = `${e.nama_anggota}|${e.nik || ""}`
        if (!memberSavings.has(key)) memberSavings.set(key, { pokok: 0, wajib: 0, sukarela: 0, nik: e.nik })
        const m = memberSavings.get(key)!
        if (e.nama_akun === "Simpanan Pokok") m.pokok += kredit
        if (e.nama_akun === "Simpanan Wajib") m.wajib += kredit
        if (e.nama_akun === "Simpanan Sukarela") m.sukarela += kredit
      }
    }

    // Balance check & auto-balance
    let totalD = 0, totalK = 0
    for (const [, bal] of accountBalances) {
      if (bal > 0) totalK += bal; else totalD += Math.abs(bal)
    }
    const diff = Math.round((totalK - totalD) * 100) / 100
    if (Math.abs(diff) > 0.01) {
      // Only use Kas for auto-balance (no Sukarela inflation)
      if (diff > 0) accountBalances.set("Kas", (accountBalances.get("Kas") ?? 0) - diff)
      else accountBalances.set("Kas", (accountBalances.get("Kas") ?? 0) + Math.abs(diff))
    }

    // Build detail entries
    const detailEntries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    for (const [nama, bal] of accountBalances) {
      if (Math.abs(bal) < 0.01) continue
      const kode = AKUN_MAP[nama]
      if (!kode) { console.warn(`  ⚠ Skipping unknown account: ${nama}`); continue }
      if (bal > 0) detailEntries.push({ akunKode: kode, debit: 0, kredit: bal })
      else detailEntries.push({ akunKode: kode, debit: Math.abs(bal), kredit: 0 })
    }

    // Final balance check
    const jD = detailEntries.reduce((s, e) => s + e.debit, 0)
    const jK = detailEntries.reduce((s, e) => s + e.kredit, 0)
    if (Math.abs(jD - jK) > 0.01) {
      console.warn(`  ⚠ Journal ${tgl} still unbalanced (D:${jD} K:${jK}), skipping`)
      continue
    }

    // Create journal
    const dateStr = `${tglDate.getFullYear()}${String(tglDate.getMonth() + 1).padStart(2, "0")}${String(tglDate.getDate()).padStart(2, "0")}`
    const noJurnal = `JRN-${dateStr}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`

    await prisma.jurnalUmum.create({
      data: {
        noJurnal,
        tanggal: tglDate,
        keterangan: `Transaksi ${tgl}`,
        createdById: adminUser!.id,
        detail: {
          create: detailEntries.map((e) => ({
            akunId: akunMap.get(e.akunKode)!,
            debit: e.debit,
            kredit: e.kredit,
          })),
        },
      },
    })
    totalJurnal++
    totalLines += dayEntries.length

    // Create/update member savings
    for (const [key, sim] of memberSavings) {
      const [nama, nik] = key.split("|")
      let anggotaId: string | undefined

      if (nik) {
        anggotaId = memberIdByNameNik.get(`${nama}|${nik}`)
      }
      if (!anggotaId) {
        anggotaId = memberIdByName.get(nama)
      }
      if (!anggotaId) continue

      for (const [jenis, nominal] of [["POKOK", sim.pokok], ["WAJIB", sim.wajib], ["SUKARELA", sim.sukarela]] as const) {
        if (nominal <= 0) continue
        const jsId = jenisSimpananMap.get(jenis)
        if (!jsId) continue

        const existing = await prisma.simpanan.findUnique({
          where: { anggotaId_jenisSimpananId: { anggotaId, jenisSimpananId: jsId } },
        })
        const saldoLama = existing ? Number(existing.saldo) : 0
        const saldoBaru = saldoLama + nominal

        if (existing) {
          await prisma.simpanan.update({ where: { id: existing.id }, data: { saldo: saldoBaru } })
        } else {
          await prisma.simpanan.create({ data: { anggotaId, jenisSimpananId: jsId, saldo: saldoBaru } })
        }

        await prisma.transaksiSimpanan.create({
          data: {
            anggotaId,
            jenisSimpananId: jsId,
            tipe: "SETORAN",
            nominal,
            saldoSetelah: saldoBaru,
            keterangan: `Setoran via migrasi jurnal ${tgl}`,
            dibuatOlehId: adminUser!.id,
            createdAt: tglDate,
          },
        })
      }
    }
  }

  console.log(`  ${totalJurnal} journals created (${totalLines} lines)`)
  console.log("\n=== MIGRASI SELESAI ===")
}

main()
  .catch((e) => { console.error("❌ Gagal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
