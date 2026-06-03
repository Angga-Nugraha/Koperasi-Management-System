"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  ajukanPinjamanSchema,
  setujuiPinjamanSchema,
  cairkanPinjamanSchema,
  bayarAngsuranSchema,
  bayarAngsuranKeSchema,
  hapusPinjamanSchema,
} from "@/lib/validations/pinjaman"
import { z } from "zod"
import { buatJurnal, COA_KAS, COA_PIUTANG_PINJAMAN, COA_PENDAPATAN_JASA, COA_PENDAPATAN_DENDA } from "@/lib/jurnal"
import { catatLog } from "@/lib/audit"
import { getKonfig, getNumber } from "@/lib/konfig"
import { generateNoStrukAngsuran } from "@/lib/struk"

async function kirimNotif(params: { userId: string; title: string; message: string; type: string; relatedId?: string }) {
  const { kirimNotifikasi } = await import("@/lib/notifikasi")
  return kirimNotifikasi(params)
}

export async function getPinjamanList(params: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { search, status, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (status && status !== "SEMUA") where.status = status
  if (search) {
    where.anggota = { nama: { contains: search } }
  }

  const [raw, total] = await Promise.all([
    prisma.pinjaman.findMany({
      where,
      include: {
        anggota: { select: { id: true, nama: true, noAnggota: true } },
        jenisPinjaman: { select: { id: true, nama: true, bunga: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.pinjaman.count({ where }),
  ])

  const data = raw.map((p) => ({
    id: p.id,
    anggotaId: p.anggotaId,
    noAnggota: p.anggota.noAnggota,
    namaAnggota: p.anggota.nama,
    jenisPinjamanId: p.jenisPinjamanId,
    jenisPinjaman: p.jenisPinjaman.nama,
    jumlah: Number(p.jumlah),
    tenor: p.tenor,
    bunga: Number(p.bunga),
    sisaPinjaman: Number(p.sisaPinjaman),
    status: p.status,
    tglPengajuan: p.tglPengajuan.toISOString(),
    tglCair: p.tglCair?.toISOString() ?? null,
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getPinjamanById(pinjamanId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.pinjaman.findUnique({
    where: { id: pinjamanId },
    include: {
      anggota: { select: { id: true, nama: true, noAnggota: true } },
      jenisPinjaman: { select: { id: true, nama: true, bunga: true } },
      angsuran: { orderBy: { angsuranKe: "asc" } },
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    anggotaId: raw.anggotaId,
    noAnggota: raw.anggota.noAnggota,
    namaAnggota: raw.anggota.nama,
    jenisPinjamanId: raw.jenisPinjamanId,
    jenisPinjaman: raw.jenisPinjaman.nama,
    jumlah: Number(raw.jumlah),
    tenor: raw.tenor,
    bunga: Number(raw.bunga),
    angsuranPokok: Number(raw.angsuranPokok),
    angsuranJasa: Number(raw.angsuranJasa),
    angsuranTotal: Number(raw.angsuranTotal),
    sisaPinjaman: Number(raw.sisaPinjaman),
    status: raw.status,
    tglPengajuan: raw.tglPengajuan.toISOString(),
    tglDisetujui: raw.tglDisetujui?.toISOString() ?? null,
    tglDitolak: raw.tglDitolak?.toISOString() ?? null,
    tglCair: raw.tglCair?.toISOString() ?? null,
    keterangan: raw.keterangan,
    createdAt: raw.createdAt.toISOString(),
    angsuran: raw.angsuran.map((a) => {
      const isLastUnpaid = a.status !== "LUNAS" && Number(raw.sisaPinjaman) < Number(a.pokok)
      const pokok = isLastUnpaid ? Number(raw.sisaPinjaman) : Number(a.pokok)
      return {
        id: a.id,
        angsuranKe: a.angsuranKe,
        jatuhTempo: a.jatuhTempo.toISOString(),
        tglBayar: a.tglBayar?.toISOString() ?? null,
        pokok,
        jasa: Number(a.jasa),
        denda: Number(a.denda),
        total: pokok + Number(a.jasa) + Number(a.denda),
        status: a.status,
      }
    }),
  }
}

export async function getPinjamanAnggota(anggotaId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.pinjaman.findMany({
    where: { anggotaId },
    include: {
      jenisPinjaman: { select: { id: true, nama: true, bunga: true } },
      angsuran: { orderBy: { angsuranKe: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })

  return raw.map((p) => ({
    id: p.id,
    jenisPinjaman: p.jenisPinjaman.nama,
    jumlah: Number(p.jumlah),
    tenor: p.tenor,
    bunga: Number(p.bunga),
    angsuranPokok: Number(p.angsuranPokok),
    angsuranJasa: Number(p.angsuranJasa),
    angsuranTotal: Number(p.angsuranTotal),
    sisaPinjaman: Number(p.sisaPinjaman),
    status: p.status,
    tglPengajuan: p.tglPengajuan.toISOString(),
    tglCair: p.tglCair?.toISOString() ?? null,
    keterangan: p.keterangan,
    angsuran: p.angsuran.map((a) => ({
      id: a.id,
      angsuranKe: a.angsuranKe,
      jatuhTempo: a.jatuhTempo.toISOString(),
      tglBayar: a.tglBayar?.toISOString() ?? null,
      pokok: Number(a.pokok),
      jasa: Number(a.jasa),
      denda: Number(a.denda),
      total: Number(a.total),
      status: a.status,
    })),
  }))
}

export async function ajukanPinjaman(input: z.infer<typeof ajukanPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  return _ajukanPinjaman(input, session.user.id)
}

async function _ajukanPinjaman(input: z.infer<typeof ajukanPinjamanSchema>, userId: string) {
  const parsed = ajukanPinjamanSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const pinjamanAktif = await prisma.pinjaman.findFirst({
    where: {
      anggotaId: parsed.anggotaId,
      status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIKKAN"] },
    },
  })
  if (pinjamanAktif) throw new Error("Anggota masih memiliki pinjaman aktif atau pengajuan yang belum selesai")

  const jenis = await prisma.jenisPinjaman.findUnique({ where: { id: parsed.jenisPinjamanId } })
  if (!jenis) throw new Error("Jenis pinjaman tidak ditemukan")

  const konfig = await getKonfig()
  const tenorMin = getNumber(konfig, "tenor_min", 3)
  const tenorMax = getNumber(konfig, "tenor_max", 36)
  const plafonMaxSaldo = getNumber(konfig, "plafon_max_saldo", 3)

  if (parsed.tenor < tenorMin) throw new Error(`Tenor minimal ${tenorMin} bulan`)
  if (parsed.tenor > tenorMax) throw new Error(`Tenor maksimal ${tenorMax} bulan`)

  const totalSimpanan = await prisma.simpanan.aggregate({
    where: { anggotaId: parsed.anggotaId },
    _sum: { saldo: true },
  })
  const maxPlafon = Math.round((Number(totalSimpanan._sum.saldo ?? 0) * plafonMaxSaldo) * 100) / 100
  if (parsed.jumlah > maxPlafon) throw new Error(`Jumlah pinjaman melebihi plafon. Maksimal Rp${maxPlafon.toLocaleString("id-ID")} (${plafonMaxSaldo}× saldo simpanan)`)
  if (parsed.jumlah <= 0) throw new Error("Jumlah pinjaman harus lebih dari 0")

  const angsuranPokok = Number((parsed.jumlah / parsed.tenor).toFixed(2))
  const angsuranJasa = Number((parsed.jumlah * (Number(jenis.bunga) / 100)).toFixed(2))
  const angsuranTotal = Number((angsuranPokok + angsuranJasa).toFixed(2))

  const created = await prisma.pinjaman.create({
    data: {
      anggotaId: parsed.anggotaId,
      jenisPinjamanId: parsed.jenisPinjamanId,
      jumlah: parsed.jumlah,
      tenor: parsed.tenor,
      bunga: Number(jenis.bunga),
      angsuranPokok,
      angsuranJasa,
      angsuranTotal,
      sisaPinjaman: 0,
      status: "PENGAJUAN",
      tglPengajuan: new Date(),
      keterangan: parsed.keterangan || null,
    },
  })

  await catatLog({
    userId,
    action: "CREATE",
    entityType: "PINJAMAN",
    entityId: created.id,
    newValue: { anggotaId: parsed.anggotaId, jumlah: parsed.jumlah, tenor: parsed.tenor },
  })

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PENGURUS", "BENDAHARA"] }, isActive: true },
    select: { id: true },
  })
  for (const admin of admins) {
    await kirimNotif({
      userId: admin.id,
      title: "Pengajuan Pinjaman Baru",
      message: `${anggota.nama} mengajukan pinjaman Rp${Number(parsed.jumlah).toLocaleString("id-ID")}`,
      type: "PENGAJUAN",
      relatedId: created.id,
    })
  }

  const anggotaUser = await prisma.user.findUnique({ where: { anggotaId: parsed.anggotaId } })
  if (anggotaUser) {
    await kirimNotif({
      userId: anggotaUser.id,
      title: "Pinjaman Diajukan",
      message: `Pinjaman Rp${Number(parsed.jumlah).toLocaleString("id-ID")} berhasil diajukan`,
      type: "PENGAJUAN",
      relatedId: created.id,
    })
  }

  revalidatePath("/pengurus/pinjaman")
  revalidatePath("/anggota/pinjaman")
  return { success: true }
}

export async function setujuiPinjaman(input: z.infer<typeof setujuiPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setujuiPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status !== "PENGAJUAN") throw new Error("Pinjaman sudah diproses")

  await prisma.pinjaman.update({
    where: { id: parsed.pinjamanId },
    data: {
      status: "DISETUJUI",
      tglDisetujui: new Date(),
      disetujuiOlehId: session.user.id,
      keterangan: parsed.keterangan
        ? pinjaman.keterangan
          ? `${pinjaman.keterangan}\n\n--- Catatan Persetujuan ---\n${parsed.keterangan}`
          : `--- Catatan Persetujuan ---\n${parsed.keterangan}`
        : pinjaman.keterangan,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "DISETUJUI" },
  })

  const anggotaUser = await prisma.user.findUnique({ where: { anggotaId: pinjaman.anggotaId } })
  if (anggotaUser) {
    await kirimNotif({
      userId: anggotaUser.id,
      title: "Pinjaman Disetujui",
      message: `Pinjaman Rp${Number(pinjaman.jumlah).toLocaleString("id-ID")} telah disetujui`,
      type: "DISETUJUI",
      relatedId: parsed.pinjamanId,
    })
  }

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function tolakPinjaman(input: z.infer<typeof setujuiPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setujuiPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status !== "PENGAJUAN") throw new Error("Pinjaman sudah diproses")

  await prisma.pinjaman.update({
    where: { id: parsed.pinjamanId },
    data: {
      status: "DITOLAK",
      tglDitolak: new Date(),
      keterangan: parsed.keterangan
        ? pinjaman.keterangan
          ? `${pinjaman.keterangan}\n\n--- Alasan Penolakan ---\n${parsed.keterangan}`
          : `--- Alasan Penolakan ---\n${parsed.keterangan}`
        : pinjaman.keterangan,
    },
  })

  await catatLog({
    userId: session.user.id,
    action: "REJECT",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "DITOLAK" },
  })

  const anggotaUser = await prisma.user.findUnique({ where: { anggotaId: pinjaman.anggotaId } })
  if (anggotaUser) {
    await kirimNotif({
      userId: anggotaUser.id,
      title: "Pinjaman Ditolak",
      message: `Pinjaman Rp${Number(pinjaman.jumlah).toLocaleString("id-ID")} telah ditolak`,
      type: "DITOLAK",
      relatedId: parsed.pinjamanId,
    })
  }

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function cairkanPinjaman(input: z.infer<typeof cairkanPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = cairkanPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({
    where: { id: parsed.pinjamanId },
    include: { anggota: { select: { noAnggota: true, nama: true } } },
  })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status !== "DISETUJUI") throw new Error("Pinjaman harus disetujui terlebih dahulu")

  const tglCair = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.pinjaman.update({
      where: { id: parsed.pinjamanId },
      data: {
        status: "DICAIKKAN",
        tglCair,
        sisaPinjaman: Number(pinjaman.jumlah),
      },
    })

    const angsuranData = Array.from({ length: pinjaman.tenor }, (_, i) => {
      const bulan = i + 1
      const jatuhTempo = new Date(tglCair)
      jatuhTempo.setMonth(jatuhTempo.getMonth() + bulan)

      const pokokBulan = bulan === pinjaman.tenor
        ? Number(pinjaman.jumlah) - Number(pinjaman.angsuranPokok) * (pinjaman.tenor - 1)
        : Number(pinjaman.angsuranPokok)

      return {
        pinjamanId: parsed.pinjamanId,
        angsuranKe: bulan,
        jatuhTempo,
        pokok: pokokBulan,
        jasa: Number(pinjaman.angsuranJasa),
        total: pokokBulan + Number(pinjaman.angsuranJasa),
        status: "BELUM_LUNAS" as const,
      }
    })

    await tx.angsuran.createMany({ data: angsuranData })

    await buatJurnal(tx, {
      tanggal: tglCair,
      keterangan: `Pencairan Pinjaman ${pinjaman.anggota.noAnggota} - ${pinjaman.anggota.nama}`,
      entries: [
        { akunKode: COA_PIUTANG_PINJAMAN, debit: Number(pinjaman.jumlah), kredit: 0 },
        { akunKode: COA_KAS, debit: 0, kredit: Number(pinjaman.jumlah) },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "DISBURSE",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "DICAIKKAN", jumlah: Number(pinjaman.jumlah) },
  })

  const anggotaUser = await prisma.user.findUnique({ where: { anggotaId: pinjaman.anggotaId } })
  if (anggotaUser) {
    await kirimNotif({
      userId: anggotaUser.id,
      title: "Pinjaman Dicairkan",
      message: `Pinjaman Rp${Number(pinjaman.jumlah).toLocaleString("id-ID")} telah dicairkan`,
      type: "DICAIKKAN",
      relatedId: parsed.pinjamanId,
    })
  }

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function bayarAngsuran(input: z.infer<typeof bayarAngsuranSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = bayarAngsuranSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({
    where: { id: parsed.pinjamanId },
    include: {
      anggota: { select: { noAnggota: true, nama: true } },
      angsuran: { where: { status: { in: ["BELUM_LUNAS", "TERLAMBAT"] } }, orderBy: { angsuranKe: "asc" } },
    },
  })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status === "LUNAS") throw new Error("Pinjaman sudah lunas")

  const nextAngsuran = pinjaman.angsuran[0]
  if (!nextAngsuran) throw new Error("Semua angsuran sudah lunas")

  const isLastAngsuran = pinjaman.angsuran.length === 1

  const tglBayar = new Date()
  const pokok = isLastAngsuran ? Number(pinjaman.sisaPinjaman) : Number(nextAngsuran.pokok)
  const jasa = Number(nextAngsuran.jasa)

  const konfig = await getKonfig()
  const dendaPerHari = getNumber(konfig, "denda_per_hari", 0.5)
  const gracePeriod = getNumber(konfig, "grace_period", 7)

  const jatuhTempo = nextAngsuran.jatuhTempo
  const daysLate = Math.max(0, Math.floor((tglBayar.getTime() - jatuhTempo.getTime()) / (1000 * 60 * 60 * 24)))
  const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
  const denda = effectiveDaysLate > 0
    ? Number(((pokok + jasa) * (dendaPerHari / 100) * effectiveDaysLate).toFixed(2))
    : 0
  const totalHarusDibayar = pokok + jasa + denda
  if (parsed.nominal < totalHarusDibayar) throw new Error(`Pembayaran kurang. Total yang harus dibayar: Rp${totalHarusDibayar.toLocaleString("id-ID")} (pokok Rp${pokok.toLocaleString("id-ID")} + jasa Rp${jasa.toLocaleString("id-ID")}${denda > 0 ? ` + denda Rp${denda.toLocaleString("id-ID")}` : ""})`)
  const sisaPinjamanSetelah = Number(pinjaman.sisaPinjaman) - pokok
  const isLunas = sisaPinjamanSetelah <= 0

  await prisma.$transaction(async (tx) => {
    await tx.angsuran.update({
      where: { id: nextAngsuran.id },
      data: {
        tglBayar,
        denda,
        total: pokok + jasa + denda,
        status: "LUNAS",
      },
    })

    await tx.pinjaman.update({
      where: { id: parsed.pinjamanId },
      data: {
        sisaPinjaman: Math.max(0, sisaPinjamanSetelah),
        status: isLunas ? "LUNAS" : pinjaman.status,
      },
    })

    const entries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    const totalBayar = pokok + jasa + denda
    if (totalBayar > 0) {
      entries.push({ akunKode: COA_KAS, debit: totalBayar, kredit: 0 })
    }
    if (pokok > 0) {
      entries.push({ akunKode: COA_PIUTANG_PINJAMAN, debit: 0, kredit: pokok })
    }
    if (jasa > 0) {
      entries.push({ akunKode: COA_PENDAPATAN_JASA, debit: 0, kredit: jasa })
    }
    if (denda > 0) {
      entries.push({ akunKode: COA_PENDAPATAN_DENDA, debit: 0, kredit: denda })
    }

    if (entries.length > 0) {
      await buatJurnal(tx, {
        tanggal: tglBayar,
        keterangan: `Bayar Angsuran #${nextAngsuran.angsuranKe} Pinjaman ${pinjaman.anggota.noAnggota} - ${pinjaman.anggota.nama}`,
        entries,
        createdById: session.user.id,
      })
    }
  })

  await catatLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "ANGSURAN",
    entityId: nextAngsuran.id,
    newValue: { angsuranKe: nextAngsuran.angsuranKe, pokok, jasa, denda, isLunas },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function bayarAngsuranKe(input: z.infer<typeof bayarAngsuranKeSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = bayarAngsuranKeSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({
    where: { id: parsed.pinjamanId },
    include: {
      anggota: { select: { nama: true, noAnggota: true } },
      angsuran: {
        where: { angsuranKe: parsed.angsuranKe },
      },
    },
  })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status === "LUNAS") throw new Error("Pinjaman sudah lunas")

  const angsuran = pinjaman.angsuran[0]
  if (!angsuran) throw new Error(`Angsuran ke-${parsed.angsuranKe} tidak ditemukan`)
  if (angsuran.status === "LUNAS") throw new Error(`Angsuran ke-${parsed.angsuranKe} sudah lunas`)

  const sisaAngsuran = await prisma.angsuran.count({
    where: { pinjamanId: parsed.pinjamanId, status: { in: ["BELUM_LUNAS", "TERLAMBAT"] } },
  })
  const isLastAngsuran = sisaAngsuran === 1
  const pokok = isLastAngsuran ? Number(pinjaman.sisaPinjaman) : Number(angsuran.pokok)
  const jasa = Number(angsuran.jasa)

  const konfig = await getKonfig()
  const dendaPerHari = getNumber(konfig, "denda_per_hari", 0.5)
  const gracePeriod = getNumber(konfig, "grace_period", 7)

  const tglBayar = new Date()
  const jatuhTempo = angsuran.jatuhTempo
  const daysLate = Math.max(0, Math.floor((tglBayar.getTime() - jatuhTempo.getTime()) / (1000 * 60 * 60 * 24)))
  const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
  const denda = effectiveDaysLate > 0
    ? Number(((pokok + jasa) * (dendaPerHari / 100) * effectiveDaysLate).toFixed(2))
    : 0
  const sisaPinjamanSetelah = Number(pinjaman.sisaPinjaman) - pokok
  const isLunas = sisaPinjamanSetelah <= 0
  const noStruk = await generateNoStrukAngsuran()

  await prisma.$transaction(async (tx) => {
    await tx.angsuran.update({
      where: { id: angsuran.id },
      data: {
        tglBayar,
        denda,
        total: pokok + jasa + denda,
        status: "LUNAS",
        noStruk,
      },
    })

    await tx.pinjaman.update({
      where: { id: parsed.pinjamanId },
      data: {
        sisaPinjaman: Math.max(0, sisaPinjamanSetelah),
        status: isLunas ? "LUNAS" : pinjaman.status,
      },
    })

    const entries: Array<{ akunKode: string; debit: number; kredit: number }> = []
    const totalBayar = pokok + jasa + denda
    if (totalBayar > 0) {
      entries.push({ akunKode: COA_KAS, debit: totalBayar, kredit: 0 })
    }
    if (pokok > 0) {
      entries.push({ akunKode: COA_PIUTANG_PINJAMAN, debit: 0, kredit: pokok })
    }
    if (jasa > 0) {
      entries.push({ akunKode: COA_PENDAPATAN_JASA, debit: 0, kredit: jasa })
    }
    if (denda > 0) {
      entries.push({ akunKode: COA_PENDAPATAN_DENDA, debit: 0, kredit: denda })
    }

    if (entries.length > 0) {
      await buatJurnal(tx, {
        tanggal: tglBayar,
        keterangan: `Bayar Angsuran #${angsuran.angsuranKe} Pinjaman ${pinjaman.anggota.noAnggota} - ${pinjaman.anggota.nama}`,
        entries,
        createdById: session.user.id,
      })
    }
  })

  await catatLog({
    userId: session.user.id,
    action: "PAYMENT",
    entityType: "ANGSURAN",
    entityId: angsuran.id,
    newValue: { angsuranKe: angsuran.angsuranKe, pokok, jasa, denda, isLunas },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)

  const anggotaUserBayar = await prisma.user.findUnique({ where: { anggotaId: pinjaman.anggotaId } })
  if (anggotaUserBayar) {
    await kirimNotif({
      userId: anggotaUserBayar.id,
      title: isLunas ? "Pinjaman Lunas" : "Angsuran Dibayar",
      message: `Angsuran ke-${angsuran.angsuranKe} pinjaman Rp${Number(pinjaman.jumlah).toLocaleString("id-ID")} berhasil dibayar${isLunas ? " — Pinjaman LUNAS" : ""}`,
      type: "DISETUJUI",
      relatedId: parsed.pinjamanId,
    })
  }

  return {
    success: true,
    data: {
      noStruk,
      angsuranKe: angsuran.angsuranKe,
      pokok,
      jasa,
      denda,
      total: pokok + jasa + denda,
      tglBayar: tglBayar.toISOString(),
      anggota: { nama: pinjaman.anggota?.nama ?? "", noAnggota: pinjaman.anggota?.noAnggota ?? "" },
      pinjaman: { id: pinjaman.id, jumlah: Number(pinjaman.jumlah), sisaPinjaman: Math.max(0, sisaPinjamanSetelah), isLunas },
      petugas: session.user.email ?? "Petugas",
    },
  }
}

export async function hapusPinjaman(input: z.infer<typeof hapusPinjamanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = hapusPinjamanSchema.parse(input)

  const pinjaman = await prisma.pinjaman.findUnique({ where: { id: parsed.pinjamanId } })
  if (!pinjaman) throw new Error("Pinjaman tidak ditemukan")
  if (pinjaman.status === "LUNAS") throw new Error("Pinjaman lunas tidak bisa dihapus")

  await prisma.pinjaman.update({
    where: { id: parsed.pinjamanId },
    data: { status: "GAGAL" },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PINJAMAN",
    entityId: parsed.pinjamanId,
    newValue: { status: "GAGAL" },
  })

  revalidatePath("/pengurus/pinjaman")
  revalidatePath(`/pengurus/pinjaman/${parsed.pinjamanId}`)
  return { success: true }
}

export async function getJenisPinjamanList() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const raw = await prisma.jenisPinjaman.findMany({
    orderBy: { nama: "asc" },
  })

  return raw.map((j) => ({
    id: j.id,
    nama: j.nama,
    bunga: Number(j.bunga),
    keterangan: j.keterangan,
  }))
}

export async function getPlafonAnggota(anggotaId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const konfig = await getKonfig()
  const plafonMaxSaldo = getNumber(konfig, "plafon_max_saldo", 3)

  const totalSimpanan = await prisma.simpanan.aggregate({
    where: { anggotaId },
    _sum: { saldo: true },
  })
  const totalSimpananAnggota = Number(totalSimpanan._sum.saldo ?? 0)
  const maxPlafon = Math.round(totalSimpananAnggota * plafonMaxSaldo * 100) / 100

  return {
    maxPlafon,
    totalSimpanan: totalSimpananAnggota,
    plafonMaxSaldo,
  }
}

export async function ajukanPinjamanAnggota(input: {
  jenisPinjamanId: string
  jumlah: number
  tenor: number
  keterangan?: string | null
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ANGGOTA") throw new Error("Unauthorized")
  if (!session.user.anggotaId) throw new Error("Akun tidak terhubung ke anggota")

  return _ajukanPinjaman({
    anggotaId: session.user.anggotaId,
    jenisPinjamanId: input.jenisPinjamanId,
    jumlah: input.jumlah,
    tenor: input.tenor,
    keterangan: input.keterangan ?? null,
  }, session.user.id)
}
