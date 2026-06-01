import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"

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
  console.log("Menambahkan user default jika belum ada...\n")

  const users = [
    { email: "admin@simko.com", password: "admin123", role: "ADMIN" as const },
    { email: "bendahara@simko.test", password: "pengurus123", role: "BENDAHARA" as const },
    { email: "pengawas@simko.test", password: "pengawas123", role: "PENGAWAS" as const },
  ]

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } })
    if (existing) {
      console.log(`  ⏭️  ${u.email} sudah ada, skip`)
      continue
    }

    await prisma.user.create({
      data: {
        id: uuidv4(),
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        role: u.role,
        isActive: true,
      },
    })
    console.log(`  ✅ ${u.email} / ${u.password} (${u.role})`)
  }

  console.log("\nSelesai!")
}

main()
  .catch((e) => {
    console.error("❌ Gagal:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
