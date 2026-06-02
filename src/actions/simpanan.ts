"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { setorSimpananSchema, tarikSimpananSchema, penutupanSimpananSchema, generateTagihanSchema, getTagihanListSchema, bayarTagihanSchema } from "@/lib/validations/simpanan"
import { z } from "zod"
import { buatJurnal, COA_KAS, getSimpananAkun } from "@/lib/jurnal"
import { catatLog } from "@/lib/audit"
import { generateNoStrukTagihan, generateNoStrukSimpanan } from "@/lib/struk"

async function kirimNotif(params: { userId: string; title: string; message: string; type: string; relatedId?: string }) {
  const { kirimNotifikasi } = await import("@/lib/notifikasi")
  return kirimNotifikasi(params)
}

export async function getJenisSimpananList() {
  const session = await auth()
  if (!session?.user) return []

  const raw = await prisma.jenisSimpanan.findMany({
    orderBy: { urutan: "asc" },
  })

  return raw.map((j) => ({
    id: j.id,
    kode: j.kode,
    nama: j.nama,
    minimalSetoran: Number(j.minimalSetoran),
    keterangan: j.keterangan,
  }))
}

export async function getSimpananList(params: {
  search?: string
  jenisSimpananId?: string
  page?: number
  pageSize?: number
}) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { search, jenisSimpananId, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (jenisSimpananId) where.jenisSimpananId = jenisSimpananId
  if (search) {
    where.anggota = { nama: { contains: search } }
  }

  const [raw, total] = await Promise.all([
    prisma.simpanan.findMany({
      where,
      include: {
        anggota: { select: { id: true, nama: true, noAnggota: true } },
        jenisSimpanan: { select: { kode: true, nama: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.simpanan.count({ where }),
  ])

  const data = raw.map((s) => ({
    id: s.id,
    anggotaId: s.anggotaId,
    noAnggota: s.anggota.noAnggota,
    namaAnggota: s.anggota.nama,
    jenisSimpananId: s.jenisSimpananId,
    jenisKode: s.jenisSimpanan.kode,
    jenisNama: s.jenisSimpanan.nama,
    saldo: Number(s.saldo),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getSimpananAnggota(anggotaId: string) {
  const raw = await prisma.simpanan.findMany({
    where: { anggotaId },
    include: { jenisSimpanan: { select: { kode: true, nama: true } } },
    orderBy: { jenisSimpanan: { urutan: "asc" } },
  })

  return raw.map((s) => ({
    id: s.id,
    jenisSimpananId: s.jenisSimpananId,
    jenisKode: s.jenisSimpanan.kode,
    jenisNama: s.jenisSimpanan.nama,
    saldo: Number(s.saldo),
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }))
}

export async function getMutasiAnggota(
  anggotaId: string,
  params: { jenisSimpananId?: string; page?: number; pageSize?: number }
) {
  const { jenisSimpananId, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = { anggotaId }
  if (jenisSimpananId) where.jenisSimpananId = jenisSimpananId

  const [raw, total] = await Promise.all([
    prisma.transaksiSimpanan.findMany({
      where,
      include: { jenisSimpanan: { select: { kode: true, nama: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaksiSimpanan.count({ where }),
  ])

  const data = raw.map((t) => ({
    id: t.id,
    jenisSimpananId: t.jenisSimpananId,
    jenisKode: t.jenisSimpanan.kode,
    jenisNama: t.jenisSimpanan.nama,
    tipe: t.tipe,
    nominal: Number(t.nominal),
    saldoSetelah: Number(t.saldoSetelah),
    keterangan: t.keterangan,
    createdAt: t.createdAt.toISOString(),
  }))

  return { data, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function setorSimpanan(input: z.infer<typeof setorSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = setorSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const jenis = await prisma.jenisSimpanan.findUnique({ where: { id: parsed.jenisSimpananId } })
  if (!jenis) throw new Error("Jenis simpanan tidak ditemukan")

  if (parsed.nominal < Number(jenis.minimalSetoran)) {
    throw new Error(`Setoran ${jenis.nama} minimal Rp${Number(jenis.minimalSetoran).toLocaleString("id-ID")}`)
  }

  const noStruk = await generateNoStrukSimpanan()

  await prisma.$transaction(async (tx) => {
    const simpanan = await tx.simpanan.upsert({
      where: { anggotaId_jenisSimpananId: { anggotaId: parsed.anggotaId, jenisSimpananId: parsed.jenisSimpananId } },
      create: {
        anggotaId: parsed.anggotaId,
        jenisSimpananId: parsed.jenisSimpananId,
        saldo: parsed.nominal,
      },
      update: {
        saldo: { increment: parsed.nominal },
      },
    })

    await tx.transaksiSimpanan.create({
      data: {
        anggotaId: parsed.anggotaId,
        jenisSimpananId: parsed.jenisSimpananId,
        tipe: "SETORAN",
        nominal: parsed.nominal,
        saldoSetelah: Number(simpanan.saldo),
        keterangan: parsed.keterangan || null,
        noStruk,
      },
    })

    const akunSimpanan = getSimpananAkun(jenis.kode)
    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Setoran ${jenis.nama} ${anggota.noAnggota}`,
      entries: [
        { akunKode: COA_KAS, debit: parsed.nominal, kredit: 0 },
        { akunKode: akunSimpanan, debit: 0, kredit: parsed.nominal },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SETORAN_SIMPANAN",
    entityId: parsed.anggotaId,
    newValue: { jenisSimpananId: parsed.jenisSimpananId, nominal: parsed.nominal },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)

  const admins = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "PENGURUS", "BENDAHARA"] }, isActive: true },
    select: { id: true },
  })
  for (const admin of admins) {
    await kirimNotif({
      userId: admin.id,
      title: "Setoran Simpanan",
      message: `${anggota.nama} melakukan setoran ${jenis.nama} Rp${parsed.nominal.toLocaleString("id-ID")}`,
      type: "SETORAN",
    })
  }

  const anggotaUser = await prisma.user.findUnique({ where: { anggotaId: parsed.anggotaId } })
  if (anggotaUser) {
    await kirimNotif({
      userId: anggotaUser.id,
      title: "Setoran Simpanan",
      message: `Setoran ${jenis.nama} Rp${parsed.nominal.toLocaleString("id-ID")} berhasil`,
      type: "SETORAN",
    })
  }

  return {
    success: true,
    data: {
      noStruk,
      nominal: parsed.nominal,
      createdAt: new Date().toISOString(),
      anggota: { nama: anggota.nama, noAnggota: anggota.noAnggota },
      jenisSimpanan: { nama: jenis.nama, kode: jenis.kode },
      tipe: "SETORAN" as const,
      petugas: session.user.email ?? "Petugas",
      keterangan: parsed.keterangan || null,
    },
  }
}

export async function tarikSimpanan(input: z.infer<typeof tarikSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = tarikSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  const jenis = await prisma.jenisSimpanan.findUnique({ where: { id: parsed.jenisSimpananId } })
  if (!jenis) throw new Error("Jenis simpanan tidak ditemukan")

  const simpanan = await prisma.simpanan.findUnique({
    where: { anggotaId_jenisSimpananId: { anggotaId: parsed.anggotaId, jenisSimpananId: parsed.jenisSimpananId } },
  })
  if (!simpanan) throw new Error("Simpanan tidak ditemukan")
  if (Number(simpanan.saldo) < parsed.nominal) throw new Error("Saldo tidak mencukupi")

  const noStruk = await generateNoStrukSimpanan()

  await prisma.$transaction(async (tx) => {
    await tx.simpanan.update({
      where: { anggotaId_jenisSimpananId: { anggotaId: parsed.anggotaId, jenisSimpananId: parsed.jenisSimpananId } },
      data: { saldo: { decrement: parsed.nominal } },
    })

    await tx.transaksiSimpanan.create({
      data: {
        anggotaId: parsed.anggotaId,
        jenisSimpananId: parsed.jenisSimpananId,
        tipe: "PENARIKAN",
        nominal: parsed.nominal,
        saldoSetelah: Number(simpanan.saldo) - parsed.nominal,
        keterangan: parsed.keterangan || null,
        noStruk,
      },
    })

    const akunSimpanan = getSimpananAkun(jenis.kode)
    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Penarikan ${jenis.nama} ${anggota.noAnggota}`,
      entries: [
        { akunKode: akunSimpanan, debit: parsed.nominal, kredit: 0 },
        { akunKode: COA_KAS, debit: 0, kredit: parsed.nominal },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PENARIKAN_SIMPANAN",
    entityId: parsed.anggotaId,
    newValue: { jenisSimpananId: parsed.jenisSimpananId, nominal: parsed.nominal },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return {
    success: true,
    data: {
      noStruk,
      nominal: parsed.nominal,
      createdAt: new Date().toISOString(),
      anggota: { nama: anggota.nama, noAnggota: anggota.noAnggota },
      jenisSimpanan: { nama: jenis.nama, kode: jenis.kode },
      tipe: "PENARIKAN" as const,
      petugas: session.user.email ?? "Petugas",
      keterangan: parsed.keterangan || null,
    },
  }
}

export async function penutupanSimpanan(input: z.infer<typeof penutupanSimpananSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = penutupanSimpananSchema.parse(input)

  const anggota = await prisma.anggota.findUnique({ where: { id: parsed.anggotaId } })
  if (!anggota) throw new Error("Anggota tidak ditemukan")
  if (anggota.status === "KELUAR") throw new Error("Anggota sudah keluar")

  const jenisPokokWajib = await prisma.jenisSimpanan.findMany({
    where: { kode: { in: ["POKOK", "WAJIB"] } },
  })
  const jenisIds = jenisPokokWajib.map((j) => j.id)

  const simpananList = await prisma.simpanan.findMany({
    where: { anggotaId: parsed.anggotaId, jenisSimpananId: { in: jenisIds } },
    include: { jenisSimpanan: true },
  })

  if (simpananList.length === 0) throw new Error("Tidak ada simpanan pokok atau wajib")

  await prisma.$transaction(async (tx) => {
    for (const simpanan of simpananList) {
      const saldo = Number(simpanan.saldo)
      if (saldo <= 0) continue

      await tx.simpanan.update({
        where: { id: simpanan.id },
        data: { saldo: { decrement: saldo } },
      })

      await tx.transaksiSimpanan.create({
        data: {
          anggotaId: parsed.anggotaId,
          jenisSimpananId: simpanan.jenisSimpananId,
          tipe: "PENARIKAN",
          nominal: saldo,
          saldoSetelah: 0,
          keterangan: parsed.keterangan || "Penutupan keanggotaan",
        },
      })

      const akunSimpanan = getSimpananAkun(simpanan.jenisSimpanan.kode)
      await buatJurnal(tx, {
        tanggal: new Date(),
        keterangan: `Penutupan ${simpanan.jenisSimpanan.nama} ${anggota.noAnggota}`,
        entries: [
          { akunKode: akunSimpanan, debit: saldo, kredit: 0 },
          { akunKode: COA_KAS, debit: 0, kredit: saldo },
        ],
        createdById: session.user.id,
      })
    }

    await tx.anggota.update({
      where: { id: parsed.anggotaId },
      data: { status: "KELUAR" },
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "PENUTUPAN_SIMPANAN",
    entityId: parsed.anggotaId,
    newValue: { status: "KELUAR" },
  })

  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/simpanan/${parsed.anggotaId}`)
  revalidatePath("/pengurus/anggota")
  revalidatePath(`/pengurus/anggota/${parsed.anggotaId}`)
  return { success: true }
}

export async function getTagihanWajibList(params: z.infer<typeof getTagihanListSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const { bulan, tahun, status, search, page, pageSize } = getTagihanListSchema.parse(params)

  const where: Record<string, unknown> = {}
  if (bulan) where.bulan = bulan
  if (tahun) where.tahun = tahun
  if (status) where.status = status
  if (search) {
    where.anggota = {
      OR: [
        { nama: { contains: search, mode: "insensitive" } },
        { noAnggota: { contains: search, mode: "insensitive" } },
      ],
    }
  }

  const [data, total] = await Promise.all([
    prisma.tagihanSimpanan.findMany({
      where,
      include: {
        anggota: { select: { id: true, noAnggota: true, nama: true } },
      },
      orderBy: [{ tahun: "desc" }, { bulan: "desc" }, { anggota: { nama: "asc" } }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.tagihanSimpanan.count({ where }),
  ])

  return {
    data: data.map((t) => ({
      id: t.id,
      anggotaId: t.anggotaId,
      noAnggota: t.anggota.noAnggota,
      namaAnggota: t.anggota.nama,
      bulan: t.bulan,
      tahun: t.tahun,
      nominal: Number(t.nominal),
      jatuhTempo: t.jatuhTempo.toISOString(),
      tglBayar: t.tglBayar?.toISOString() ?? null,
      status: t.status,
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function generateTagihanWajib(input: z.infer<typeof generateTagihanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = generateTagihanSchema.parse(input)
  const now = new Date()
  const bulan = parsed.bulan ?? now.getMonth() + 1
  const tahun = parsed.tahun ?? now.getFullYear()

  const jenisWajib = await prisma.jenisSimpanan.findUnique({ where: { kode: "WAJIB" } })
  if (!jenisWajib) throw new Error("Jenis simpanan WAJIB tidak ditemukan")

  const anggota = await prisma.anggota.findMany({
    where: { status: "AKTIF" },
    select: { id: true },
  })

  const jatuhTempo = new Date(tahun, bulan - 1, 10)

  const createdIds: string[] = []
  let count = 0
  for (const a of anggota) {
    const existing = await prisma.tagihanSimpanan.findUnique({
      where: {
        anggotaId_jenisSimpananId_bulan_tahun: {
          anggotaId: a.id,
          jenisSimpananId: jenisWajib.id,
          bulan,
          tahun,
        },
      },
    })
    if (existing) continue

    await prisma.tagihanSimpanan.create({
      data: {
        anggotaId: a.id,
        jenisSimpananId: jenisWajib.id,
        bulan,
        tahun,
        nominal: Number(jenisWajib.minimalSetoran),
        jatuhTempo,
        status: "BELUM_LUNAS",
      },
    })
    createdIds.push(a.id)
    count++
  }

  if (createdIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { anggotaId: { in: createdIds } },
      select: { id: true },
    })
    for (const u of users) {
      await kirimNotif({
        userId: u.id,
        title: `Tagihan Wajib ${bulan}/${tahun}`,
        message: `Tagihan simpanan wajib Rp${Number(jenisWajib.minimalSetoran).toLocaleString("id-ID")} telah diterbitkan, jatuh tempo ${jatuhTempo.toLocaleDateString("id-ID")}`,
        type: "TAGIHAN",
      })
    }
  }

  revalidatePath("/pengurus/simpanan/tagihan")
  return { count }
}

export async function bayarTagihanWajib(input: z.infer<typeof bayarTagihanSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = bayarTagihanSchema.parse(input)

  const tagihan = await prisma.tagihanSimpanan.findUnique({
    where: { id: parsed.tagihanId },
    include: {
      anggota: { select: { id: true, noAnggota: true, nama: true } },
      jenisSimpanan: { select: { id: true, nama: true, kode: true } },
    },
  })
  if (!tagihan) throw new Error("Tagihan tidak ditemukan")
  if (tagihan.status === "LUNAS") throw new Error("Tagihan sudah lunas")

  const noStruk = await generateNoStrukTagihan()

  await prisma.$transaction(async (tx) => {
    const simpanan = await tx.simpanan.upsert({
      where: {
        anggotaId_jenisSimpananId: {
          anggotaId: tagihan.anggotaId,
          jenisSimpananId: tagihan.jenisSimpananId,
        },
      },
      create: {
        anggotaId: tagihan.anggotaId,
        jenisSimpananId: tagihan.jenisSimpananId,
        saldo: Number(tagihan.nominal),
      },
      update: {
        saldo: { increment: Number(tagihan.nominal) },
      },
    })

    await tx.transaksiSimpanan.create({
      data: {
        anggotaId: tagihan.anggotaId,
        jenisSimpananId: tagihan.jenisSimpananId,
        tipe: "SETORAN",
        nominal: Number(tagihan.nominal),
        saldoSetelah: Number(simpanan.saldo),
        keterangan: `Pembayaran tagihan ${tagihan.jenisSimpanan.nama} periode ${tagihan.bulan}/${tagihan.tahun}`,
        noStruk,
      },
    })

    await tx.tagihanSimpanan.update({
      where: { id: tagihan.id },
      data: {
        status: "LUNAS",
        tglBayar: new Date(),
        noStruk,
      },
    })

    const akunSimpanan = getSimpananAkun(tagihan.jenisSimpanan.kode)
    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Pembayaran tagihan ${tagihan.jenisSimpanan.nama} ${tagihan.anggota.noAnggota} ${tagihan.bulan}/${tagihan.tahun}`,
      entries: [
        { akunKode: COA_KAS, debit: Number(tagihan.nominal), kredit: 0 },
        { akunKode: akunSimpanan, debit: 0, kredit: Number(tagihan.nominal) },
      ],
      createdById: session.user.id,
    })
  })

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SETORAN_SIMPANAN",
    entityId: tagihan.anggotaId,
    newValue: {
      jenisSimpananId: tagihan.jenisSimpananId,
      nominal: Number(tagihan.nominal),
      tagihan: `${tagihan.bulan}/${tagihan.tahun}`,
    },
  })

  revalidatePath("/pengurus/simpanan/tagihan")
  revalidatePath("/pengurus/simpanan")
  revalidatePath(`/pengurus/anggota/${tagihan.anggotaId}`)

  const anggotaUser = await prisma.user.findUnique({ where: { anggotaId: tagihan.anggotaId } })
  if (anggotaUser) {
    await kirimNotif({
      userId: anggotaUser.id,
      title: "Pembayaran Tagihan",
      message: `Tagihan ${tagihan.jenisSimpanan.nama} periode ${tagihan.bulan}/${tagihan.tahun} sebesar Rp${Number(tagihan.nominal).toLocaleString("id-ID")} berhasil dibayar`,
      type: "TAGIHAN",
    })
  }

  return {
    success: true,
    data: {
      noStruk,
      nominal: Number(tagihan.nominal),
      createdAt: new Date().toISOString(),
      anggota: { nama: tagihan.anggota.nama, noAnggota: tagihan.anggota.noAnggota },
      petugas: session.user.email ?? "Petugas",
      bulan: tagihan.bulan,
      tahun: tagihan.tahun,
    },
  }
}

export async function getTagihanWajibAnggota(anggotaId: string) {
  const raw = await prisma.tagihanSimpanan.findMany({
    where: { anggotaId },
    orderBy: [{ tahun: "desc" }, { bulan: "desc" }],
  })

  return raw.map((t) => ({
    id: t.id,
    bulan: t.bulan,
    tahun: t.tahun,
    nominal: Number(t.nominal),
    jatuhTempo: t.jatuhTempo.toISOString(),
    tglBayar: t.tglBayar?.toISOString() ?? null,
    status: t.status,
  }))
}

export async function ensureTagihanWajibAnggota(anggotaId: string) {
  const now = new Date()
  const bulan = now.getMonth() + 1
  const tahun = now.getFullYear()

  const jenisWajib = await prisma.jenisSimpanan.findUnique({ where: { kode: "WAJIB" } })
  if (!jenisWajib) return

  const existing = await prisma.tagihanSimpanan.findUnique({
    where: {
      anggotaId_jenisSimpananId_bulan_tahun: {
        anggotaId,
        jenisSimpananId: jenisWajib.id,
        bulan,
        tahun,
      },
    },
  })
  if (existing) return

  const jatuhTempo = new Date(tahun, bulan - 1, 10)
  await prisma.tagihanSimpanan.create({
    data: {
      anggotaId,
      jenisSimpananId: jenisWajib.id,
      bulan,
      tahun,
      nominal: Number(jenisWajib.minimalSetoran),
      jatuhTempo,
      status: "BELUM_LUNAS",
    },
  })
}

export async function cariAnggota(query: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  if (!query || query.length < 1) return []

  const anggota = await prisma.anggota.findMany({
    where: {
      status: "AKTIF",
      OR: [
        { nama: { contains: query } },
        { noAnggota: { contains: query } },
      ],
    },
    select: { id: true, noAnggota: true, nama: true },
    take: 20,
    orderBy: { noAnggota: "asc" },
  })

  return anggota
}

export async function getAnggotaBasic(id: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const anggota = await prisma.anggota.findUnique({
    where: { id },
    select: { id: true, noAnggota: true, nama: true },
  })

  return anggota
}
