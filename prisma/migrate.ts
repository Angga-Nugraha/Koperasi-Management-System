import "dotenv/config"
import { PrismaClient } from "@prisma/client"
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
  "Kas": "1.1.1",
  "Simpanan Pokok": "2.1.1",
  "Simpanan Wajib": "2.1.2",
  "Simpanan Sukarela": "2.1.3",
  "ATK dan Perlengkapan Kantor": "5.1.4",
  "Transportasi": "5.1.5",
}

type AnggotaRaw = { nama: string; NIK: string; alamat: string; jenisKelamin: string; pekerjaan: string; noHp: string; tglMasuk: string }
type JurnalRaw = { tanggal: string; keterangan: string; nama_anggota: string | null; nama_akun: string; debit: number | null; kredit: number | null; nik: string | null }

async function main() {
  console.log("=== MIGRASI DATA ===\n")

  const existingJurnal = await prisma.jurnalUmum.count()
  if (existingJurnal > 0) {
    console.log("  ⏭️  Data already migrated (jurnal found), skipping.")
    return
  }

  const anggotaData: AnggotaRaw[] = JSON.parse(fs.readFileSync(path.join(__dirname, "anggota.json"), "utf-8"))
  const jurnalData: JurnalRaw[] = JSON.parse(fs.readFileSync(path.join(__dirname, "jurnal.json"), "utf-8"))

  // ========== 1. IMPORT MEMBERS ==========
  console.log("1. Importing members...")

  anggotaData.sort((a, b) => {
    if (a.tglMasuk !== b.tglMasuk) {
      if (!a.tglMasuk) return 1
      if (!b.tglMasuk) return -1
      return a.tglMasuk.localeCompare(b.tglMasuk)
    }
    return a.nama.localeCompare(b.nama)
  })

  const memberIdByNik = new Map<string, string>()
  let memberCount = 0
  let seq = 1

  for (const m of anggotaData) {
    const tglMasuk = m.tglMasuk ? new Date(m.tglMasuk + "T00:00:00+07:00") : new Date()
    const datePart = `${String(tglMasuk.getFullYear()).slice(-2)}${String(tglMasuk.getMonth() + 1).padStart(2, "0")}${String(tglMasuk.getDate()).padStart(2, "0")}`
    const noAnggota = `AGT${datePart}${String(seq).padStart(4, "0")}`
    seq++

    const existing = await prisma.anggota.findUnique({ where: { nik: m.NIK } })
    if (existing) {
      console.warn(`  ⚠ Skipping duplicate NIK: ${m.NIK} (${m.nama})`)
      memberIdByNik.set(m.NIK, existing.id)
      continue
    }

    const anggota = await prisma.anggota.create({
      data: {
        noAnggota,
        nik: m.NIK,
        nama: m.nama,
        noHp: m.noHp || null,
        jenisKelamin: m.jenisKelamin || null,
        alamat: m.alamat || "-",
        pekerjaan: m.pekerjaan || null,
        tglMasuk,
        status: "AKTIF",
      },
    })

    const passwordHash = await bcrypt.hash(m.nama.toLowerCase().replace(/\s+/g, ""), 4)
    const email = `${noAnggota}@cibunar.com`
    const userExists = await prisma.user.findUnique({ where: { email } })
    if (!userExists) {
      await prisma.user.create({
        data: { email, passwordHash, role: "ANGGOTA", anggotaId: anggota.id },
      })
    }

    memberIdByNik.set(m.NIK, anggota.id)
    memberCount++
  }
  console.log(`  ${memberCount} members created`)

  // ========== 2. IMPORT JOURNALS ==========
  console.log("\n2. Importing journal entries...")

  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!adminUser) throw new Error("Admin user not found. Run seed first.")

  const akunList = await prisma.akun.findMany()
  const akunMap = new Map(akunList.map((a) => [a.kode, a.id]))
  const jenisSimpananMap = new Map<string, string>()
  for (const js of await prisma.jenisSimpanan.findMany()) {
    jenisSimpananMap.set(js.kode, js.id)
  }

  const byTanggal = new Map<string, JurnalRaw[]>()
  for (const e of jurnalData) {
    if (!byTanggal.has(e.tanggal)) byTanggal.set(e.tanggal, [])
    byTanggal.get(e.tanggal)!.push(e)
  }

  let totalJurnal = 0
  let totalLines = 0

  for (const [tgl, dayEntries] of byTanggal) {
    const tglDate = new Date(tgl + "T00:00:00+07:00")

    const memberSavings = new Map<string, { pokok: number; wajib: number; sukarela: number }>()

    for (const e of dayEntries) {
      if (e.nama_anggota && ["Simpanan Pokok", "Simpanan Wajib", "Simpanan Sukarela"].includes(e.nama_akun)) {
        const key = e.nik ?? e.nama_anggota
        if (!memberSavings.has(key)) memberSavings.set(key, { pokok: 0, wajib: 0, sukarela: 0 })
        const m = memberSavings.get(key)!
        const kredit = e.kredit ?? 0
        if (e.nama_akun === "Simpanan Pokok") m.pokok += kredit
        if (e.nama_akun === "Simpanan Wajib") m.wajib += kredit
        if (e.nama_akun === "Simpanan Sukarela") m.sukarela += kredit
      }
    }

    const detailEntries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    for (const e of dayEntries) {
      const debit = e.debit ?? 0
      const kredit = e.kredit ?? 0
      if (debit === 0 && kredit === 0) continue
      if (e.nama_akun === "Kas" && !(e.keterangan ?? "").trim()) continue
      const kode = AKUN_MAP[e.nama_akun]
      if (!kode) { console.warn(`  ⚠ Skipping unknown account: ${e.nama_akun}`); continue }
      detailEntries.push({ akunKode: kode, debit, kredit })
    }

    const jD = detailEntries.reduce((s, e) => s + e.debit, 0)
    const jK = detailEntries.reduce((s, e) => s + e.kredit, 0)
    if (Math.abs(jD - jK) > 0.01) {
      console.log(`  ~ Journal ${tgl} unbalanced (D:${jD} K:${jK} diff:${jD - jK}) — tetap diproses`)
    }

    const dateStr = `${tglDate.getFullYear()}${String(tglDate.getMonth() + 1).padStart(2, "0")}${String(tglDate.getDate()).padStart(2, "0")}`
    const noJurnal = `JRN-${dateStr}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`

    await prisma.jurnalUmum.create({
      data: {
        noJurnal,
        tanggal: tglDate,
        keterangan: `Transaksi ${tgl}`,
        createdById: adminUser.id,
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

    for (const [key, sim] of memberSavings) {
      let anggotaId = memberIdByNik.get(key)
      if (!anggotaId) {
        const member = anggotaData.find((a) => a.NIK === key || a.nama === key)
        if (!member) continue
        anggotaId = memberIdByNik.get(member.NIK)
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
            dibuatOlehId: adminUser.id,
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
  .catch((e) => { console.error("Gagal:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
