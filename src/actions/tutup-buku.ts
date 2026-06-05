"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { buatJurnal } from "@/lib/jurnal"
import { catatLog } from "@/lib/audit"

export async function getSHUTutupBukuList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.sHU.findMany({
    orderBy: { tahun: "desc" },
    include: { _count: { select: { shuAnggota: true } } },
  })
  return raw.map((s) => ({
    id: s.id,
    tahun: s.tahun,
    totalSHU: Number(s.totalSHU),
    status: s.status,
    jumlahAnggota: s._count.shuAnggota,
  }))
}

export async function prosesTutupBuku(tahun: number) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const shu = await prisma.sHU.findUnique({
    where: { tahun },
    include: {
      alokasi: { include: { indikator: true } },
      shuAnggota: true,
    },
  })
  if (!shu) throw new Error("SHU tidak ditemukan")
  if (shu.status === "FINAL") throw new Error(`SHU tahun ${tahun} sudah ditutup`)

  const akunSHU = await prisma.akun.findFirst({ where: { kode: "3.1.2" } })
  if (!akunSHU) throw new Error("Akun SHU Tahun Berjalan tidak ditemukan")
  const akunSHUDitahan = await prisma.akun.findFirst({ where: { kode: "3.1.3" } })

  const jenisSukarela = await prisma.jenisSimpanan.findUnique({ where: { kode: "SUKARELA" } })
  if (!jenisSukarela) throw new Error("Jenis simpanan SUKARELA tidak ditemukan")

  const mulai = new Date(`${tahun}-01-01T00:00:00+07:00`)
  const selesai = new Date(`${tahun + 1}-01-01T00:00:00+07:00`)

  await prisma.$transaction(async (tx) => {
    // 0. Ubah status jadi FINAL
    await tx.sHU.update({
      where: { id: shu.id },
      data: { status: "FINAL" },
    })

    // 1. JURNAL PENUTUP — reset PENDAPATAN/BEBAN → SHU Ditahan
    const details = await tx.detailJurnal.findMany({
      where: {
        akun: { tipe: { in: ["PENDAPATAN", "BEBAN"] } },
        jurnal: { tanggal: { gte: mulai, lt: selesai } },
      },
      include: { akun: true },
    })

    const saldoAkun = new Map<string, { kode: string; nama: string; tipe: string; saldo: number }>()
    for (const d of details) {
      const existing = saldoAkun.get(d.akunId) ?? { kode: d.akun.kode, nama: d.akun.nama, tipe: d.akun.tipe, saldo: 0 }
      if (d.akun.tipe === "PENDAPATAN") {
        existing.saldo += Number(d.kredit) - Number(d.debit)
      } else {
        existing.saldo += Number(d.debit) - Number(d.kredit)
      }
      saldoAkun.set(d.akunId, existing)
    }

    const tutupEntries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    let totalPendapatan = 0
    let totalBeban = 0

    for (const [, akun] of saldoAkun) {
      const s = Math.round(akun.saldo * 100) / 100
      if (s === 0) continue
      if (akun.tipe === "PENDAPATAN") {
        tutupEntries.push({ akunKode: akun.kode, debit: s, kredit: 0 })
        totalPendapatan += s
      } else {
        tutupEntries.push({ akunKode: akun.kode, debit: 0, kredit: s })
        totalBeban += s
      }
    }

    const shuTB = Math.round((totalPendapatan - totalBeban) * 100) / 100

    const anggotaTotal = shu.shuAnggota.reduce((s, a) => s + Number(a.total), 0)
    const danaAlokasi = shu.alokasi.filter((a) => a.indikator.kelompok === "DANA")
    const danaTotal = danaAlokasi.reduce((s, a) => s + Number(a.nominal), 0)

    if (shuTB > 0) {
      const akunSimpanan = await tx.akun.findFirst({ where: { kode: "2.1.3" } })
      // ANGGOTA → langsung ke Simpanan Sukarela (2.1.3)
      if (akunSimpanan && anggotaTotal > 0) {
        tutupEntries.push({ akunKode: akunSimpanan.kode, debit: 0, kredit: anggotaTotal })
      }
      // DANA → langsung ke akun masing-masing (tanpa lewat 3.1.2)
      for (const a of danaAlokasi) {
        const nominal = Number(a.nominal)
        if (nominal <= 0) continue
        const akunKode = a.indikator.akunId
          ? (await tx.akun.findUnique({ where: { id: a.indikator.akunId } }))?.kode ?? akunSHU.kode
          : akunSHU.kode
        tutupEntries.push({ akunKode, debit: 0, kredit: nominal })
      }
      // Sisa rounding (jika ada) — taruh ke SHU Ditahan
      const sisa = Math.round((shuTB - anggotaTotal - danaTotal) * 100) / 100
      if (sisa !== 0) {
        tutupEntries.push({
          akunKode: akunSHUDitahan?.kode ?? akunSHU.kode,
          debit: sisa < 0 ? Math.abs(sisa) : 0,
          kredit: sisa > 0 ? sisa : 0,
        })
      }
    } else if (shuTB < 0) {
      tutupEntries.push({ akunKode: akunSHUDitahan?.kode ?? akunSHU.kode, debit: Math.abs(shuTB), kredit: 0 })
    }

    if (tutupEntries.length > 0) {
      await buatJurnal(tx, {
        tanggal: new Date(`${tahun}-12-31T23:59:59+07:00`),
        keterangan: `Jurnal Penutup Tahun ${tahun}`,
        entries: tutupEntries,
        createdById: session.user.id,
      })
    }

    // 2. DISTRIBUSI ANGGOTA — tambah ke simpanan sukarela

    for (const sa of shu.shuAnggota) {
      const totalSHUAnggota = Number(sa.total)
      if (totalSHUAnggota <= 0) continue

      const existing = await tx.simpanan.findUnique({
        where: {
          anggotaId_jenisSimpananId: {
            anggotaId: sa.anggotaId,
            jenisSimpananId: jenisSukarela.id,
          },
        },
      })

      const saldoLama = existing ? Number(existing.saldo) : 0
      const saldoBaru = saldoLama + totalSHUAnggota

      if (existing) {
        await tx.simpanan.update({
          where: { id: existing.id },
          data: { saldo: saldoBaru },
        })
      } else {
        await tx.simpanan.create({
          data: {
            anggotaId: sa.anggotaId,
            jenisSimpananId: jenisSukarela.id,
            saldo: saldoBaru,
          },
        })
      }

      await tx.transaksiSimpanan.create({
        data: {
          anggotaId: sa.anggotaId,
          jenisSimpananId: jenisSukarela.id,
          tipe: "SETORAN",
          nominal: totalSHUAnggota,
          saldoSetelah: saldoBaru,
          keterangan: `Distribusi SHU Tahun ${tahun}`,
          dibuatOlehId: session.user.id,
        },
      })
    }

  })

  await catatLog({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "SHU",
    newValue: { tahun, status: "FINAL" },
  })

  revalidatePath("/pengurus/tutup-buku")
  revalidatePath("/pengurus/shu")
  return { success: true }
}
