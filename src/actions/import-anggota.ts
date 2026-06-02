"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import Papa from "papaparse"
import { generateNoAnggota } from "@/lib/utils/anggota"

export type ImportRowResult = {
  row: number
  nik: string
  nama: string
  success: boolean
  error?: string
}

export async function importAnggotaFromCsv(formData: FormData) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "PENGURUS" && session.user.role !== "BENDAHARA")) {
    throw new Error("Unauthorized")
  }

  const file = formData.get("file") as File
  if (!file) {
    throw new Error("File tidak ditemukan")
  }

  const text = await file.text()

  const { data, errors: parseErrors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (parseErrors.length > 0) {
    throw new Error(`Gagal membaca CSV: ${parseErrors[0]?.message ?? "Format tidak sesuai"}`)
  }

  if (data.length === 0) {
    throw new Error("File CSV kosong")
  }

  const results: ImportRowResult[] = []
  const validRows: { row: number; nik: string; nama: string; alamat: string; pekerjaan: string; penghasilan: number | null; tglMasuk: Date }[] = []

  for (let i = 0; i < data.length; i++) {
    const raw = data[i] as Record<string, string>
    const rowNum = i + 2

    const nik = raw.nik?.trim()
    const nama = raw.nama?.trim()
    const alamat = raw.alamat?.trim()
    const pekerjaan = raw.pekerjaan?.trim()
    const penghasilanRaw = raw.penghasilan?.trim()
    const tglMasuk = raw.tglMasuk?.trim()

    if (!nik || !nama || !alamat || !tglMasuk) {
      results.push({ row: rowNum, nik: nik || "", nama: nama || "", success: false, error: "Kolom wajib (nik, nama, alamat, tglMasuk) tidak lengkap" })
      continue
    }

    if (!/^\d{16}$/.test(nik)) {
      results.push({ row: rowNum, nik, nama, success: false, error: "NIK harus 16 digit angka" })
      continue
    }

    if (nama.length < 3 || nama.length > 100) {
      results.push({ row: rowNum, nik, nama, success: false, error: "Nama harus 3-100 karakter" })
      continue
    }

    if (alamat.length < 10) {
      results.push({ row: rowNum, nik, nama, success: false, error: "Alamat minimal 10 karakter" })
      continue
    }

    if (pekerjaan && pekerjaan.length > 100) {
      results.push({ row: rowNum, nik, nama, success: false, error: "Pekerjaan maksimal 100 karakter" })
      continue
    }

    let penghasilan: number | null = null
    if (penghasilanRaw) {
      penghasilan = Number(penghasilanRaw)
      if (isNaN(penghasilan) || penghasilan < 0) {
        results.push({ row: rowNum, nik, nama, success: false, error: "Penghasilan harus angka positif" })
        continue
      }
    }

    const tglMasukDate = new Date(tglMasuk)
    if (isNaN(tglMasukDate.getTime())) {
      results.push({ row: rowNum, nik, nama, success: false, error: "Tanggal masuk tidak valid (format: YYYY-MM-DD)" })
      continue
    }

    validRows.push({ row: rowNum, nik, nama, alamat, pekerjaan: pekerjaan || "", penghasilan, tglMasuk: tglMasukDate })
  }

  const nikList = validRows.map((r) => r.nik)
  const existingNikList = await prisma.anggota.findMany({
    where: { nik: { in: nikList } },
    select: { nik: true },
  })
  const existingNikSet = new Set(existingNikList.map((a) => a.nik))

  const dateGroups = new Map<string, typeof validRows>()
  for (const row of validRows) {
    if (existingNikSet.has(row.nik)) {
      results.push({ row: row.row, nik: row.nik, nama: row.nama, success: false, error: "NIK sudah terdaftar" })
      continue
    }
    const key = row.tglMasuk.toISOString().slice(0, 10)
    const group = dateGroups.get(key) ?? []
    group.push(row)
    dateGroups.set(key, group)
  }

  await prisma.$transaction(async (tx) => {
    for (const [, group] of dateGroups) {
      const tgl = group[0]!.tglMasuk
      tgl.setHours(0, 0, 0, 0)
      const nextDay = new Date(tgl)
      nextDay.setDate(nextDay.getDate() + 1)

      let urutan = (await tx.anggota.count({
        where: { tglMasuk: { gte: tgl, lt: nextDay } },
      })) + 1

      for (const row of group) {
        try {
          const noAnggota = generateNoAnggota(row.tglMasuk, urutan++)
          await tx.anggota.create({
            data: {
              nik: row.nik,
              noAnggota,
              nama: row.nama,
              alamat: row.alamat,
              pekerjaan: row.pekerjaan || null,
              penghasilan: row.penghasilan,
              tglMasuk: row.tglMasuk,
              status: "AKTIF",
            },
          })
          results.push({ row: row.row, nik: row.nik, nama: row.nama, success: true })
        } catch {
          results.push({ row: row.row, nik: row.nik, nama: row.nama, success: false, error: "Gagal menyimpan data" })
        }
      }
    }
  })

  revalidatePath("/pengurus/anggota")
  return results
}
