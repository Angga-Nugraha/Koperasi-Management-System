import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

const url = process.env.DATABASE_URL ?? ""
const parsed = new URL(url)
const adapter = new PrismaMariaDb({
  host: parsed.hostname,
  port: Number(parsed.port) || 3306,
  user: decodeURIComponent(parsed.username),
  password: decodeURIComponent(parsed.password),
  database: parsed.pathname.replace(/^\//, ""),
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const statuses = await prisma.pinjaman.groupBy({ by: ["status"], _count: { id: true } })
  console.log(JSON.stringify(statuses, null, 2))
  await prisma.$disconnect()
}
main()
