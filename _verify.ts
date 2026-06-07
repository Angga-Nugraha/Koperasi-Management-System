import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url)
  return { host: parsed.hostname, port: Number(parsed.port) || 3306, user: decodeURIComponent(parsed.username), password: decodeURIComponent(parsed.password), database: parsed.pathname.replace(/^\//, "") }
}
const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL ?? "")
const adapter = new PrismaMariaDb(dbConfig)
const prisma = new PrismaClient({ adapter })

async function main() {
  const members = await prisma.anggota.findMany({ orderBy: { nama: "asc" } })
  console.log(`Total members: ${members.length}`)

  for (const m of members) {
    if (m.nama.includes("Nurhayati") || m.nama.includes("Yani")) {
      const simpanan = await prisma.simpanan.findMany({ where: { anggotaId: m.id }, include: { jenisSimpanan: true } })
      const details = simpanan.map(s => `${s.jenisSimpanan.kode}=${Number(s.saldo)}`).join(", ")
      console.log(`${m.nama} (${m.noAnggota}, NIK=${m.nik}): ${details}`)
    }
  }

  const allSimpanan = await prisma.simpanan.findMany()
  const byJenis: Record<string, number> = {}
  for (const s of allSimpanan) byJenis[s.jenisSimpananId] = (byJenis[s.jenisSimpananId] || 0) + Number(s.saldo)
  const jenis = await prisma.jenisSimpanan.findMany()
  for (const j of jenis) console.log(`${j.kode} total: ${(byJenis[j.id] || 0).toLocaleString()}`)

  const allKas = await prisma.detailJurnal.findMany({ include: { akun: true } })
  let kasD = 0, kasK = 0
  for (const d of allKas) {
    if (d.akun.nama === "Kas") { kasD += Number(d.debit); kasK += Number(d.kredit) }
  }
  console.log(`\nDB Kas D: ${kasD.toLocaleString()}`)
  console.log(`DB Kas K: ${kasK.toLocaleString()}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
