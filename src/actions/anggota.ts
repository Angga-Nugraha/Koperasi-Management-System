/**
 * @file src/actions/anggota.ts
 * @description Server Action untuk mengelola operasi CRUD dan data Anggota Koperasi.
 */

"use server"

import { prisma, PrismaTx } from "@/lib/prisma"
import { anggotaSchema, anggotaUpdateSchema, anggotaStatusSchema } from "@/lib/validations/anggota"
import { auth, assertRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { Prisma } from "@prisma/client"
import { generateNoAnggota } from "@/lib/utils/anggota"
import { deleteOrphanFiles, renameAnggotaFile } from "@/lib/utils/file"
import { anggotaFilter, anggotaTanggalFilter } from "@/lib/where"
import { catatLog } from "@/lib/audit"
import { generateTagihanAnggotaBaru } from "@/actions/simpanan"
import { buatJurnal, getSimpananAkun, COA_KAS } from "@/lib/jurnal"
import bcrypt from "bcryptjs"
import { z } from "zod"

export async function getAnggotaList(params: {
  search?: string
  status?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: string
}) {
  const { search, status, sortBy, sortOrder, page = 1, pageSize = 20 } = params

  const where = anggotaFilter({ search, status })

  const SORTABLE: Record<string, string> = { noAnggota: "noAnggota", tglMasuk: "tglMasuk" }
  const orderBy =
    sortBy && SORTABLE[sortBy]
      ? { [SORTABLE[sortBy]]: sortOrder === "asc" ? ("asc" as const) : ("desc" as const) }
      : { createdAt: "desc" as const }

  const [raw, total] = await Promise.all([
    prisma.anggota.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
    }),
    prisma.anggota.count({ where }),
  ])

  const data = raw.map((a) => ({
    id: a.id,
    nik: a.nik,
    noAnggota: a.noAnggota,
    nama: a.nama,
    noHp: a.noHp,
    jenisKelamin: a.jenisKelamin,
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
    noHp: raw.noHp,
    jenisKelamin: raw.jenisKelamin,
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
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const parsed = anggotaSchema.parse(input)

  const existing = await prisma.anggota.findUnique({ where: { nik: parsed.nik } })
  if (existing) {
    throw new Error("NIK sudah terdaftar")
  }

  const tglMasuk = new Date(parsed.tglMasuk)
  tglMasuk.setHours(0, 0, 0, 0)
  const tglFilter = anggotaTanggalFilter(tglMasuk)

  const created = await prisma.$transaction(
    async (tx) => {
      const count = await tx.anggota.count({
        where: { tglMasuk: tglFilter },
      })
      const u = count + 1
      const noAnggota = generateNoAnggota(tglMasuk, u)

      return tx.anggota.create({
        data: {
          nik: parsed.nik,
          noAnggota,
          nama: parsed.nama,
          noHp: parsed.noHp || null,
          jenisKelamin: parsed.jenisKelamin || null,
          alamat: parsed.alamat,
          pekerjaan: parsed.pekerjaan || null,
          penghasilan: parsed.penghasilan ?? null,
          foto: parsed.foto ?? null,
          ktp: parsed.ktp ?? null,
          tglMasuk,
          status: "AKTIF",
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )

  const fotoUrl = (await renameAnggotaFile(parsed.foto, created.noAnggota)) ?? parsed.foto
  const ktpUrl = (await renameAnggotaFile(parsed.ktp, created.noAnggota)) ?? parsed.ktp

  if (fotoUrl !== parsed.foto || ktpUrl !== parsed.ktp) {
    await prisma.anggota.update({
      where: { id: created.id },
      data: { foto: fotoUrl, ktp: ktpUrl },
    })
  }

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
    newValue: { nik: parsed.nik, noAnggota: created.noAnggota, nama: parsed.nama },
  })

  revalidatePath("/pengurus/anggota")

  await generateTagihanAnggotaBaru(created.id, tglMasuk).catch(() => {})
  return { success: true, data: { id: created.id, noAnggota: created.noAnggota } }
}

export async function updateAnggota(input: z.infer<typeof anggotaUpdateSchema>) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

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
      nik: parsed.nik,
      nama: parsed.nama,
      noHp: parsed.noHp || null,
      jenisKelamin: parsed.jenisKelamin || null,
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
  return { success: true }
}

async function prosesPenutupanAnggota(
  anggotaId: string,
  anggota: { noAnggota: string; nama: string },
  tx: PrismaTx,
) {
  const simpananList = await tx.simpanan.findMany({
    where: { anggotaId },
    include: { jenisSimpanan: true },
  })

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

    const akunSimpanan = getSimpananAkun(simpanan.jenisSimpanan.kode)
    await buatJurnal(tx, {
      tanggal: new Date(),
      keterangan: `Penutupan ${simpanan.jenisSimpanan.nama} ${anggota.noAnggota} - ${anggota.nama}`,
      entries: [
        { akunKode: akunSimpanan, debit: saldo, kredit: 0 },
        { akunKode: COA_KAS, debit: 0, kredit: saldo },
      ],
    })
  }
}

export async function updateAnggotaStatus(input: z.infer<typeof anggotaStatusSchema>) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const parsed = anggotaStatusSchema.parse(input)

  if (parsed.status === "NONAKTIF") {
    const activeLoans = await prisma.pinjaman.count({
      where: { anggotaId: parsed.id, status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIRKAN"] } },
    })
    if (activeLoans > 0) {
      throw new Error("Anggota memiliki pinjaman aktif, tidak bisa dinonaktifkan")
    }
  }

  const before = await prisma.anggota.findUnique({
    where: { id: parsed.id },
    select: { status: true },
  })

  if (parsed.status === "KELUAR") {
    const anggota = await prisma.anggota.findUnique({
      where: { id: parsed.id },
      select: { noAnggota: true, nama: true },
    })
    if (!anggota) throw new Error("Anggota tidak ditemukan")

    const activeLoans = await prisma.pinjaman.count({
      where: { anggotaId: parsed.id, status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIRKAN"] } },
    })
    if (activeLoans > 0) {
      throw new Error("Anggota memiliki pinjaman aktif, tidak bisa ditutup")
    }

    await prisma.$transaction(async (tx) => {
      await prosesPenutupanAnggota(parsed.id, anggota, tx)
      await tx.anggota.update({
        where: { id: parsed.id },
        data: { status: "KELUAR" },
      })
    })
  } else {
    await prisma.anggota.update({
      where: { id: parsed.id },
      data: { status: parsed.status },
    })
  }

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
  return { success: true }
}

export async function deleteAnggota(id: string) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

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
    const anggota = await prisma.anggota.findUnique({
      where: { id },
      select: { noAnggota: true, nama: true },
    })
    if (!anggota) throw new Error("Anggota tidak ditemukan")

    const activeLoans = await prisma.pinjaman.count({
      where: { anggotaId: id, status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIRKAN"] } },
    })
    if (activeLoans > 0) {
      throw new Error("Anggota memiliki pinjaman aktif, tidak bisa ditutup")
    }

    await prisma.$transaction(async (tx) => {
      await prosesPenutupanAnggota(id, anggota, tx)
      await tx.anggota.update({
        where: { id },
        data: { status: "KELUAR" },
      })
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
    return {
      success: true,
      message: "Anggota memiliki data transaksi, status diubah menjadi KELUAR",
    }
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
  return { success: true, message: "Anggota berhasil dihapus" }
}

export async function resetPasswordAnggota(userId: string, password: string) {
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

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
  const session = await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

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
    where: { anggotaId, status: { in: ["PENGAJUAN", "DISETUJUI", "DICAIRKAN"] } },
  })

  return {
    simpanan,
    totalSimpanan: simpanan.reduce((sum, s) => sum + Number(s.saldo), 0),
    totalPinjamanOutstanding: pinjaman.reduce((sum, p) => sum + Number(p.sisaPinjaman), 0),
  }
}

export async function getAnggotaKartu(anggotaId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")
  if (session.user.role === "ANGGOTA" && session.user.anggotaId !== anggotaId) {
    throw new Error("Forbidden")
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id: anggotaId },
    select: {
      noAnggota: true,
      nama: true,
      nik: true,
      alamat: true,
      pekerjaan: true,
      tglMasuk: true,
      foto: true,
    },
  })
  if (!anggota) throw new Error("Anggota tidak ditemukan")

  return {
    noAnggota: anggota.noAnggota,
    nama: anggota.nama,
    nik: anggota.nik,
    alamat: anggota.alamat,
    pekerjaan: anggota.pekerjaan,
    tglMasuk: anggota.tglMasuk.toISOString(),
    foto: anggota.foto,
  }
}
