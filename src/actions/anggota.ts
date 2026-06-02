"use server"

import { prisma } from "@/lib/prisma"
import { anggotaSchema, anggotaUpdateSchema, anggotaStatusSchema } from "@/lib/validations/anggota"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { generateNoAnggota } from "@/lib/utils/anggota"
import { deleteOrphanFiles } from "@/lib/utils/file"
import { catatLog } from "@/lib/audit"
import bcrypt from "bcryptjs"

export async function getAnggotaList(params: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
}) {
  const { search, status, page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}

  if (status && status !== "SEMUA") {
    where.status = status
  }

  if (search) {
    where.OR = [
      { nama: { contains: search } },
      { nik: { contains: search } },
      { noAnggota: { contains: search } },
    ]
  }

  const [raw, total] = await Promise.all([
    prisma.anggota.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.anggota.count({ where }),
  ])

  const data = raw.map((a) => ({
    id: a.id,
    nik: a.nik,
    noAnggota: a.noAnggota,
    nama: a.nama,
    alamat: a.alamat,
    pekerjaan: a.pekerjaan,
    penghasilan: a.penghasilan ? Number(a.penghasilan) : null,
    foto: a.foto,
    ktp: a.ktp,
    tglMasuk: a.tglMasuk.toISOString(),
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
}

export async function getAnggotaById(id: string) {
  const raw = await prisma.anggota.findUnique({
    where: { id },
    include: {
      simpanan: { include: { jenisSimpanan: true } },
      pinjaman: { include: { angsuran: true } },
      user: true,
    },
  })

  if (!raw) return null

  return {
    id: raw.id,
    nik: raw.nik,
    noAnggota: raw.noAnggota,
    nama: raw.nama,
    alamat: raw.alamat,
    pekerjaan: raw.pekerjaan,
    penghasilan: raw.penghasilan ? Number(raw.penghasilan) : null,
    foto: raw.foto,
    ktp: raw.ktp,
    tglMasuk: raw.tglMasuk.toISOString(),
    status: raw.status,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    simpanan: raw.simpanan.map((s) => ({
      id: s.id,
      anggotaId: s.anggotaId,
      jenisKode: s.jenisSimpanan.kode,
      jenisNama: s.jenisSimpanan.nama,
      saldo: Number(s.saldo),
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    pinjaman: raw.pinjaman.map((p) => ({
      id: p.id,
      anggotaId: p.anggotaId,
      jumlah: Number(p.jumlah),
      tenor: p.tenor,
      bunga: Number(p.bunga),
      angsuranPokok: Number(p.angsuranPokok),
      angsuranJasa: Number(p.angsuranJasa),
      angsuranTotal: Number(p.angsuranTotal),
      sisaPinjaman: Number(p.sisaPinjaman),
      status: p.status,
      tglPengajuan: p.tglPengajuan.toISOString(),
      tglDisetujui: p.tglDisetujui?.toISOString() ?? null,
      tglDitolak: p.tglDitolak?.toISOString() ?? null,
      tglCair: p.tglCair?.toISOString() ?? null,
      keterangan: p.keterangan,
      disetujuiOlehId: p.disetujuiOlehId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      angsuran: p.angsuran.map((a) => ({
        id: a.id,
        pinjamanId: a.pinjamanId,
        angsuranKe: a.angsuranKe,
        jatuhTempo: a.jatuhTempo.toISOString(),
        tglBayar: a.tglBayar?.toISOString() ?? null,
        pokok: Number(a.pokok),
        jasa: Number(a.jasa),
        denda: Number(a.denda),
        total: Number(a.total),
        status: a.status,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    })),
    user: raw.user
      ? {
          id: raw.user.id,
          email: raw.user.email,
          role: raw.user.role,
          isActive: raw.user.isActive,
          anggotaId: raw.user.anggotaId,
          createdAt: raw.user.createdAt.toISOString(),
          updatedAt: raw.user.updatedAt.toISOString(),
        }
      : null,
  }
}

export async function createAnggota(input: z.infer<typeof anggotaSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = anggotaSchema.parse(input)

  const existing = await prisma.anggota.findUnique({ where: { nik: parsed.nik } })
  if (existing) {
    throw new Error("NIK sudah terdaftar")
  }

  const tglMasuk = new Date(parsed.tglMasuk)
  tglMasuk.setHours(0, 0, 0, 0)
  const nextDay = new Date(tglMasuk)
  nextDay.setDate(nextDay.getDate() + 1)

  const urutan = (await prisma.anggota.count({
    where: { tglMasuk: { gte: tglMasuk, lt: nextDay } },
  })) + 1

  const noAnggota = generateNoAnggota(tglMasuk, urutan)

  const created = await prisma.anggota.create({
    data: {
      nik: parsed.nik,
      noAnggota,
      nama: parsed.nama,
      alamat: parsed.alamat,
      pekerjaan: parsed.pekerjaan || null,
      penghasilan: parsed.penghasilan ?? null,
      foto: parsed.foto ?? null,
      ktp: parsed.ktp ?? null,
      tglMasuk,
      status: "AKTIF",
    },
  })

  if (parsed.buatUser) {
    if (!parsed.email || !parsed.password) {
      throw new Error("Email dan password wajib diisi untuk membuat user account")
    }
    const existingEmail = await prisma.user.findUnique({ where: { email: parsed.email } })
    if (existingEmail) {
      throw new Error("Email sudah digunakan")
    }

    await prisma.user.create({
      data: {
        email: parsed.email,
        passwordHash: await bcrypt.hash(parsed.password, 10),
        role: "ANGGOTA",
        anggotaId: created.id,
        isActive: true,
      },
    })

    await catatLog({
      userId: session.user.id,
      action: "CREATE",
      entityType: "USER",
      entityId: created.id,
      newValue: { email: parsed.email, role: "ANGGOTA" },
    })
  }

  await catatLog({
    userId: session.user.id,
    action: "CREATE",
    entityType: "ANGGOTA",
    entityId: created.id,
    newValue: { nik: parsed.nik, noAnggota, nama: parsed.nama },
  })

  revalidatePath("/pengurus/anggota")
}

export async function updateAnggota(input: z.infer<typeof anggotaUpdateSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = anggotaUpdateSchema.parse(input)

  const existing = await prisma.anggota.findUnique({
    where: { id: parsed.id },
    select: { foto: true, ktp: true },
  })

  const oldFiles: string[] = []
  if (existing?.foto && existing.foto !== parsed.foto) oldFiles.push(existing.foto)
  if (existing?.ktp && existing.ktp !== parsed.ktp) oldFiles.push(existing.ktp)

  const updated = await prisma.anggota.update({
    where: { id: parsed.id },
    data: {
      nama: parsed.nama,
      alamat: parsed.alamat,
      pekerjaan: parsed.pekerjaan || null,
      penghasilan: parsed.penghasilan ?? null,
      foto: parsed.foto ?? null,
      ktp: parsed.ktp ?? null,
      tglMasuk: new Date(parsed.tglMasuk),
    },
  })

  await deleteOrphanFiles(oldFiles)
  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "ANGGOTA",
    entityId: parsed.id,
    newValue: { nama: updated.nama },
  })

  revalidatePath("/pengurus/anggota")
}

async function prosesPenutupanAnggota(anggotaId: string) {
  const jenisPokokWajib = await prisma.jenisSimpanan.findMany({
    where: { kode: { in: ["POKOK", "WAJIB"] } },
  })
  const jenisIds = jenisPokokWajib.map((j) => j.id)

  const simpananList = await prisma.simpanan.findMany({
    where: { anggotaId, jenisSimpananId: { in: jenisIds } },
  })

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
          anggotaId,
          jenisSimpananId: simpanan.jenisSimpananId,
          tipe: "PENARIKAN",
          nominal: saldo,
          saldoSetelah: 0,
          keterangan: "Penutupan keanggotaan",
        },
      })
    }
  })
}

export async function updateAnggotaStatus(input: z.infer<typeof anggotaStatusSchema>) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const parsed = anggotaStatusSchema.parse(input)

  if (parsed.status === "NONAKTIF") {
    const activeLoans = await prisma.pinjaman.count({
      where: { anggotaId: parsed.id, status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIKKAN"] } },
    })
    if (activeLoans > 0) {
      throw new Error("Anggota memiliki pinjaman aktif, tidak bisa dinonaktifkan")
    }
  }

  if (parsed.status === "KELUAR") {
    await prosesPenutupanAnggota(parsed.id)
  }

  const before = await prisma.anggota.findUnique({ where: { id: parsed.id }, select: { status: true } })

  await prisma.anggota.update({
    where: { id: parsed.id },
    data: { status: parsed.status },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE_STATUS",
    entityType: "ANGGOTA",
    entityId: parsed.id,
    oldValue: before ? { status: before.status } : null,
    newValue: { status: parsed.status },
  })

  revalidatePath("/pengurus/anggota")
  revalidatePath("/pengurus/simpanan")
}

export async function deleteAnggota(id: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id },
    select: { foto: true, ktp: true },
  })

  if (!anggota) {
    throw new Error("Anggota tidak ditemukan")
  }

  const hasRelations = await prisma.anggota.findUnique({
    where: { id },
    include: {
      simpanan: { take: 1 },
      pinjaman: { take: 1 },
    },
  })

  if (hasRelations?.simpanan.length || hasRelations?.pinjaman.length) {
    await prosesPenutupanAnggota(id)
    await prisma.anggota.update({
      where: { id },
      data: { status: "KELUAR" },
    })
    await catatLog({
      userId: session.user.id,
      action: "DELETE",
      entityType: "ANGGOTA",
      entityId: id,
      newValue: { status: "KELUAR", note: "Memiliki data transaksi" },
    })
    revalidatePath("/pengurus/anggota")
    revalidatePath("/pengurus/simpanan")
    return { message: "Anggota memiliki data transaksi, status diubah menjadi KELUAR" }
  }

  await prisma.anggota.delete({ where: { id } })
  await deleteOrphanFiles([anggota.foto, anggota.ktp])
  await catatLog({
    userId: session.user.id,
    action: "DELETE",
    entityType: "ANGGOTA",
    entityId: id,
    newValue: { deleted: true },
  })
  revalidatePath("/pengurus/anggota")
  return { message: "Anggota berhasil dihapus" }
}

export async function resetPasswordAnggota(userId: string, password: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User tidak ditemukan")

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "USER",
    entityId: userId,
    newValue: { action: "reset_password" },
  })

  return { success: true }
}

export async function toggleUserActive(userId: string) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error("User tidak ditemukan")

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  })

  await catatLog({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "USER",
    entityId: userId,
    newValue: { isActive: !user.isActive },
  })

  return { success: true, isActive: !user.isActive }
}

export async function getUserByAnggotaId(anggotaId: string) {
  const session = await auth()
  if (!session?.user) return null

  const user = await prisma.user.findUnique({
    where: { anggotaId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  }
}

export async function getAnggotaSaldo(anggotaId: string) {
  const simpanan = await prisma.simpanan.findMany({
    where: { anggotaId },
  })

  const pinjaman = await prisma.pinjaman.findMany({
    where: { anggotaId, status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIKKAN"] } },
  })

  return {
    simpanan,
    totalSimpanan: simpanan.reduce((sum, s) => sum + Number(s.saldo), 0),
    totalPinjamanOutstanding: pinjaman.reduce((sum, p) => sum + Number(p.sisaPinjaman), 0),
  }
}
