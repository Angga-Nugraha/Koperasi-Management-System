import "dotenv/config"
import { PrismaClient, LoanStatus, InstallmentStatus } from "@prisma/client"
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

// ─── Date helpers ─────────────────────────────────────
const TGL_DAFTAR = new Date("2026-01-15T00:00:00+07:00")

function makeDate(year: number, month: number, day: number) {
  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+07:00`)
}

function pad(n: number, len = 4) {
  return String(n).padStart(len, "0")
}

function kodeTanggal(tgl: Date) {
  return `${tgl.getFullYear()}${pad(tgl.getMonth() + 1, 2)}${pad(tgl.getDate(), 2)}`
}

// ─── Main ─────────────────────────────────────────────
async function main() {
  console.log("Membersihkan data lama...")

  await prisma.detailJurnal.deleteMany()
  await prisma.jurnalUmum.deleteMany()
  await prisma.angsuran.deleteMany()
  await prisma.transaksiSimpanan.deleteMany()
  await prisma.pinjaman.deleteMany()
  await prisma.simpanan.deleteMany()

  const adminUser = await prisma.user.findFirst({ where: { role: "PENGURUS" } })
  if (adminUser) {
    await prisma.user.deleteMany({ where: { role: { not: "PENGURUS" }, id: { not: adminUser.id } } })
  } else {
    await prisma.user.deleteMany()
  }
  await prisma.anggota.deleteMany()

  console.log("Data lama dibersihkan.\n")

  // ─── Anggota & User ─────────────────────────────────
  const adminUserId = adminUser?.id ?? null

  const anggotaData = [
    { nama: "Ali Ahmad", nik: "3174010101010001", email: "ali@simko.test" },
    { nama: "Budi Santoso", nik: "3174010101010002", email: "budi@simko.test" },
    { nama: "Citra Dewi", nik: "3174010101010003", email: "citra@simko.test" },
    { nama: "Dwi Lestari", nik: "3174010101010004", email: "dwi@simko.test" },
    { nama: "Eko Prasetyo", nik: "3174010101010005", email: "eko@simko.test" },
  ]

  const anggotaIds: string[] = []
  const passwordHash = await bcrypt.hash("anggota123", 10)

  for (let i = 0; i < anggotaData.length; i++) {
    const a = anggotaData[i]
    const noUrut = i + 1
    const noAnggota = `AGT260115${pad(noUrut)}`
    const anggotaId = uuidv4()

    await prisma.anggota.create({
      data: {
        id: anggotaId,
        nik: a.nik,
        noAnggota,
        nama: a.nama,
        alamat: `Jl. Contoh No. ${noUrut}`,
        status: "AKTIF",
        tglMasuk: TGL_DAFTAR,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CREATE",
        entityType: "ANGGOTA",
        entityId: anggotaId,
        newValue: { nik: a.nik, noAnggota, nama: a.nama },
      },
    })

    await prisma.user.create({
      data: {
        id: uuidv4(),
        email: a.email,
        passwordHash,
        role: "ANGGOTA",
        anggotaId,
      },
    })

    anggotaIds.push(anggotaId)
    console.log(`  Anggota: ${a.nama} (${noAnggota}, ${a.email} / anggota123)`)
  }

  // ─── User Pengurus & Pengawas ──────────────────────
  const pengurusUserId = uuidv4()
  await prisma.user.create({
    data: {
      id: pengurusUserId,
      email: "bendahara@simko.test",
      passwordHash: await bcrypt.hash("pengurus123", 10),
      role: "BENDAHARA",
    },
  })
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "CREATE",
      entityType: "USER",
      entityId: pengurusUserId,
      newValue: { email: "bendahara@simko.test", role: "BENDAHARA" },
    },
  })
  console.log("  User: bendahara@simko.test / pengurus123 (BENDAHARA)")

  const pengawasUserId = uuidv4()
  await prisma.user.create({
    data: {
      id: pengawasUserId,
      email: "pengawas@simko.test",
      passwordHash: await bcrypt.hash("pengawas123", 10),
      role: "PENGAWAS",
    },
  })
  await prisma.auditLog.create({
    data: {
      userId: adminUserId,
      action: "CREATE",
      entityType: "USER",
      entityId: pengawasUserId,
      newValue: { email: "pengawas@simko.test", role: "PENGAWAS" },
    },
  })
  console.log("  User: pengawas@simko.test / pengawas123 (PENGAWAS)")

  // ─── Akun lookup ────────────────────────────────────
  const kasAkun = await prisma.akun.findFirstOrThrow({ where: { kode: "1.1.1" } })
  const akunPokok = await prisma.akun.findFirstOrThrow({ where: { kode: "2.1.1" } })
  const akunWajib = await prisma.akun.findFirstOrThrow({ where: { kode: "2.1.2" } })
  const akunSukarela = await prisma.akun.findFirstOrThrow({ where: { kode: "2.1.3" } })
  const akunPiutang = await prisma.akun.findFirstOrThrow({ where: { kode: "1.2.1" } })
  const akunPendJasa = await prisma.akun.findFirstOrThrow({ where: { kode: "4.1.1" } })

  const jenisKonsumsi = await prisma.jenisPinjaman.findFirstOrThrow({ where: { nama: "Konsumsi" } })
  const jenisPendidikan = await prisma.jenisPinjaman.findFirstOrThrow({ where: { nama: "Pendidikan" } })

  const jenisPokok = await prisma.jenisSimpanan.findFirstOrThrow({ where: { kode: "POKOK" } })
  const jenisWajib = await prisma.jenisSimpanan.findFirstOrThrow({ where: { kode: "WAJIB" } })
  const jenisSukarela = await prisma.jenisSimpanan.findFirstOrThrow({ where: { kode: "SUKARELA" } })

  let jurnalCounter = 0

  async function buatJurnal(
    tanggal: Date,
    keterangan: string,
    entries: Array<{ akunId: string; debit: number; kredit: number }>,
  ) {
    jurnalCounter++
    await prisma.jurnalUmum.create({
      data: {
        id: uuidv4(),
        noJurnal: `JRN-${kodeTanggal(tanggal)}-${pad(jurnalCounter)}`,
        tanggal,
        keterangan,
        detail: {
          create: entries.map((e) => ({
            id: uuidv4(),
            akunId: e.akunId,
            debit: e.debit,
            kredit: e.kredit,
          })),
        },
      },
    })
  }

  function addMonths(date: Date, n: number) {
    const d = new Date(date)
    d.setMonth(d.getMonth() + n)
    return d
  }

  // ─── Simpanan ────────────────────────────────────────
  const SUKARELA_NOMINAL = [2_000_000, 3_000_000, 1_500_000, 2_500_000, 1_000_000]
  const WAJIB_PER_BULAN = 100_000

  // Current month = May 2026 → 5 months of wajib (Jan, Feb, Mar, Apr, May)
  const BULAN_WAJIB = 5

  for (let i = 0; i < anggotaIds.length; i++) {
    const anggotaId = anggotaIds[i]
    const anggota = anggotaData[i]

    // ── POKOK (one-time) ──
    const pokokNominal = 500_000
    await prisma.simpanan.create({
      data: { id: uuidv4(), anggotaId, jenisSimpananId: jenisPokok.id, saldo: pokokNominal },
    })
    await prisma.transaksiSimpanan.create({
      data: {
        id: uuidv4(), anggotaId, jenisSimpananId: jenisPokok.id, tipe: "SETORAN",
        nominal: pokokNominal, saldoSetelah: pokokNominal,
        keterangan: "Setoran awal Pokok",
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CREATE",
        entityType: "SETORAN_SIMPANAN",
        entityId: anggotaId,
        newValue: { jenis: "POKOK", nominal: pokokNominal },
      },
    })
    await buatJurnal(TGL_DAFTAR, `Setoran POKOK ${anggota.nama}`, [
      { akunId: kasAkun.id, debit: pokokNominal, kredit: 0 },
      { akunId: akunPokok.id, debit: 0, kredit: pokokNominal },
    ])

    // ── WAJIB (monthly) ──
    let totalWajib = 0
    for (let m = 0; m < BULAN_WAJIB; m++) {
      const tgl = makeDate(2026, 1 + m, 15)
      totalWajib += WAJIB_PER_BULAN

      await prisma.transaksiSimpanan.create({
        data: {
          id: uuidv4(), anggotaId, jenisSimpananId: jenisWajib.id, tipe: "SETORAN",
          nominal: WAJIB_PER_BULAN, saldoSetelah: totalWajib,
          keterangan: `Setoran Wajib bulan ${tgl.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
        },
      })
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: "CREATE",
          entityType: "SETORAN_SIMPANAN",
          entityId: anggotaId,
          newValue: { jenis: "WAJIB", nominal: WAJIB_PER_BULAN, bulan: m + 1 },
        },
      })
      await buatJurnal(tgl, `Setoran WAJIB ${anggota.nama} bulan ${m + 1}`, [
        { akunId: kasAkun.id, debit: WAJIB_PER_BULAN, kredit: 0 },
        { akunId: akunWajib.id, debit: 0, kredit: WAJIB_PER_BULAN },
      ])
    }

    // Create the simpanan wajib record with final balance
    await prisma.simpanan.create({
      data: { id: uuidv4(), anggotaId, jenisSimpananId: jenisWajib.id, saldo: totalWajib },
    })

    // ── SUKARELA (one-time) ──
    const sukarelaNominal = SUKARELA_NOMINAL[i]
    await prisma.simpanan.create({
      data: { id: uuidv4(), anggotaId, jenisSimpananId: jenisSukarela.id, saldo: sukarelaNominal },
    })
    await prisma.transaksiSimpanan.create({
      data: {
        id: uuidv4(), anggotaId, jenisSimpananId: jenisSukarela.id, tipe: "SETORAN",
        nominal: sukarelaNominal, saldoSetelah: sukarelaNominal,
        keterangan: `Setoran Sukarela ${anggota.nama}`,
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CREATE",
        entityType: "SETORAN_SIMPANAN",
        entityId: anggotaId,
        newValue: { jenis: "SUKARELA", nominal: sukarelaNominal },
      },
    })
    await buatJurnal(TGL_DAFTAR, `Setoran SUKARELA ${anggota.nama}`, [
      { akunId: kasAkun.id, debit: sukarelaNominal, kredit: 0 },
      { akunId: akunSukarela.id, debit: 0, kredit: sukarelaNominal },
    ])

    console.log(`  Simpanan: ${anggota.nama} (Pokok 500k, Wajib ${totalWajib}k, Sukarela ${(sukarelaNominal / 1_000_000).toFixed(1)}jt)`)
  }

  // ─── Pinjaman ────────────────────────────────────────
  const pinjamanConfig = [
    {
      anggotaIdx: 0, nama: anggotaData[0].nama,
      jumlah: 5_000_000, tenor: 6,
      jenis: jenisKonsumsi, bunga: Number(jenisKonsumsi.bunga),
    },
    {
      anggotaIdx: 1, nama: anggotaData[1].nama,
      jumlah: 10_000_000, tenor: 6,
      jenis: jenisPendidikan, bunga: Number(jenisPendidikan.bunga),
    },
  ]

  // April = month 1, May = month 2 → 2 installments paid
  // 4 remaining unpaid
  const ANGSURAN_LUNAS = 2

  for (const pc of pinjamanConfig) {
    const anggotaId = anggotaIds[pc.anggotaIdx]
    const pokokPerBulan = Number((pc.jumlah / pc.tenor).toFixed(2))
    const jasaPerBulan = Number((pc.jumlah * (pc.bunga / 100)).toFixed(2))
    const totalPerBulan = Number((pokokPerBulan + jasaPerBulan).toFixed(2))
    const sisaPinjaman = Number((pc.jumlah - pokokPerBulan * ANGSURAN_LUNAS).toFixed(2))

    // Apply: March 1, Approved: March 5, Disbursed: March 10
    const tglPengajuan = makeDate(2026, 3, 1)
    const tglDisetujui = makeDate(2026, 3, 5)
    const tglCair = makeDate(2026, 3, 10)

    const pinjaman = await prisma.pinjaman.create({
      data: {
        id: uuidv4(),
        anggotaId,
        jenisPinjamanId: pc.jenis.id,
        jumlah: pc.jumlah,
        tenor: pc.tenor,
        bunga: pc.bunga,
        angsuranPokok: pokokPerBulan,
        angsuranJasa: jasaPerBulan,
        angsuranTotal: totalPerBulan,
        sisaPinjaman,
        status: "DICAIKKAN" as LoanStatus,
        tglPengajuan,
        tglDisetujui,
        tglCair,
        keterangan: `Pinjaman ${pc.jenis.nama}`,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "CREATE",
        entityType: "PINJAMAN",
        entityId: pinjaman.id,
        newValue: { anggotaId, jumlah: pc.jumlah, tenor: pc.tenor },
      },
    })
    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: "DISBURSE",
        entityType: "PINJAMAN",
        entityId: pinjaman.id,
        newValue: { status: "DICAIKKAN" },
      },
    })

    // Jurnal pencairan
    await buatJurnal(tglCair, `Pencairan Pinjaman ${pc.nama}`, [
      { akunId: akunPiutang.id, debit: pc.jumlah, kredit: 0 },
      { akunId: kasAkun.id, debit: 0, kredit: pc.jumlah },
    ])

    // Angsuran
    let sisa = pc.jumlah
    for (let a = 1; a <= pc.tenor; a++) {
      const isLast = a === pc.tenor
      const pokok = isLast ? Number(sisa.toFixed(2)) : pokokPerBulan
      const sisaSetelah = Number((sisa - pokok).toFixed(2))
      const jatuhTempo = addMonths(tglCair, a)

      const angsuranStatus: InstallmentStatus = a <= ANGSURAN_LUNAS ? "LUNAS" : "BELUM_LUNAS"
      const ttl = Number((pokok + jasaPerBulan).toFixed(2))

      await prisma.angsuran.create({
        data: {
          id: uuidv4(),
          pinjamanId: pinjaman.id,
          angsuranKe: a,
          jatuhTempo,
          tglBayar: a <= ANGSURAN_LUNAS ? addMonths(tglCair, a) : null,
          pokok,
          jasa: jasaPerBulan,
          total: ttl,
          status: angsuranStatus,
        },
      })

      sisa = sisaSetelah

      if (a <= ANGSURAN_LUNAS) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: "PAYMENT",
            entityType: "ANGSURAN",
            entityId: pinjaman.id,
            newValue: { angsuranKe: a, pokok, jasa: jasaPerBulan, isLunas: false },
          },
        })
        await buatJurnal(addMonths(tglCair, a), `Bayar Angsuran #${a} Pinjaman ${pc.nama}`, [
          { akunId: kasAkun.id, debit: ttl, kredit: 0 },
          { akunId: akunPiutang.id, debit: 0, kredit: pokok },
          { akunId: akunPendJasa.id, debit: 0, kredit: jasaPerBulan },
        ])
      }
    }

    console.log(`  Pinjaman: ${pc.nama} (Rp${(pc.jumlah / 1_000_000).toFixed(0)}jt - ${ANGSURAN_LUNAS}/${pc.tenor}x dibayar - sisa Rp${(sisaPinjaman / 1_000_000).toFixed(1)}jt)`)
  }

  // ─── Summary ─────────────────────────────────────────
  const totalAnggota = await prisma.anggota.count()
  const totalUser = await prisma.user.count()
  const totalSimpanan = await prisma.simpanan.count()
  const totalPinjaman = await prisma.pinjaman.count()
  const totalJurnal = await prisma.jurnalUmum.count()
  const totalDetail = await prisma.detailJurnal.count()
  const totalAudit = await prisma.auditLog.count()

  console.log(`\n✅ Selesai!`)
  console.log(`   Anggota         : ${totalAnggota}`)
  console.log(`   User            : ${totalUser}`)
  console.log(`   Rek. Simpanan   : ${totalSimpanan}`)
  console.log(`   Pinjaman        : ${totalPinjaman}`)
  console.log(`   Jurnal          : ${totalJurnal} transaksi, ${totalDetail} baris`)
  console.log(`   Audit Log       : ${totalAudit} catatan`)
  console.log(`\n📧 Login anggota: ali@simko.test / anggota123`)
  console.log(`   Admin: email & password dari seed awal`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
