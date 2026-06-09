/**
 * @file src/actions/import-anggota.ts
 * @description Server Action untuk memproses impor data anggota dari file Excel.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { assertRole } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import Papa from "papaparse"
import { generateNoAnggota } from "@/lib/utils/anggota"
import { Prisma } from "@prisma/client"

export type PreviewRowResult = {
  row: number
  nik: string
  nama: string
  noHp?: string
  jenisKelamin?: string
  alamat: string
  pekerjaan?: string
  penghasilan: number | null
  tglMasuk: string
  isValid: boolean
  error?: string
}

export async function previewImportAnggota(formData: FormData): Promise<PreviewRowResult[]> {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

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

  const results: PreviewRowResult[] = []
  const seenNiks = new Set<string>()

  // 1st pass: basic format validation
  const parsedRows: {
    row: number
    nik: string
    nama: string
    noHp?: string
    jenisKelamin?: string
    alamat: string
    pekerjaan?: string
    penghasilan: number | null
    tglMasuk: Date
  }[] = []

  for (let i = 0; i < data.length; i++) {
    const raw = data[i] as Record<string, string>
    const rowNum = i + 2

    const nik = raw.nik?.trim()
    const nama = raw.nama?.trim()
    const noHp = raw.noHp?.trim()
    const jenisKelamin = raw.jenisKelamin?.trim()
    const alamat = raw.alamat?.trim()
    const pekerjaan = raw.pekerjaan?.trim()
    const penghasilanRaw = raw.penghasilan?.trim()
    const tglMasuk = raw.tglMasuk?.trim()

    if (!nik || !nama || !alamat || !tglMasuk) {
      results.push({
        row: rowNum,
        nik: nik || "",
        nama: nama || "",
        noHp,
        jenisKelamin,
        alamat: alamat || "",
        pekerjaan,
        penghasilan: null,
        tglMasuk: tglMasuk || "",
        isValid: false,
        error: "Kolom wajib (nik, nama, alamat, tglMasuk) tidak lengkap",
      })
      continue
    }

    if (seenNiks.has(nik)) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan: null,
        tglMasuk,
        isValid: false,
        error: "NIK duplikat dalam file CSV",
      })
      continue
    }
    seenNiks.add(nik)

    if (!/^\d{16}$/.test(nik)) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan: null,
        tglMasuk,
        isValid: false,
        error: "NIK harus 16 digit angka",
      })
      continue
    }

    if (nama.length < 3 || nama.length > 100) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan: null,
        tglMasuk,
        isValid: false,
        error: "Nama harus 3-100 karakter",
      })
      continue
    }

    if (noHp && noHp.length > 20) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan: null,
        tglMasuk,
        isValid: false,
        error: "No HP maksimal 20 karakter",
      })
      continue
    }

    let jkFormatted: string | undefined = undefined
    if (jenisKelamin) {
      const jkUpper = jenisKelamin.toUpperCase()
      if (
        jkUpper === "L" ||
        jkUpper === "LAKI-LAKI" ||
        jkUpper === "LAKI_LAKI" ||
        jkUpper === "LAKILAKI"
      ) {
        jkFormatted = "LAKI_LAKI"
      } else if (jkUpper === "P" || jkUpper === "PEREMPUAN") {
        jkFormatted = "PEREMPUAN"
      } else {
        results.push({
          row: rowNum,
          nik,
          nama,
          noHp,
          jenisKelamin,
          alamat,
          pekerjaan,
          penghasilan: null,
          tglMasuk,
          isValid: false,
          error: "Jenis kelamin harus Laki-laki (L) atau Perempuan (P)",
        })
        continue
      }
    }

    if (alamat.length < 10) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan: null,
        tglMasuk,
        isValid: false,
        error: "Alamat minimal 10 karakter",
      })
      continue
    }

    if (pekerjaan && pekerjaan.length > 100) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan: null,
        tglMasuk,
        isValid: false,
        error: "Pekerjaan maksimal 100 karakter",
      })
      continue
    }

    let penghasilan: number | null = null
    if (penghasilanRaw) {
      penghasilan = Number(penghasilanRaw)
      if (isNaN(penghasilan) || penghasilan < 0) {
        results.push({
          row: rowNum,
          nik,
          nama,
          noHp,
          jenisKelamin,
          alamat,
          pekerjaan,
          penghasilan: null,
          tglMasuk,
          isValid: false,
          error: "Penghasilan harus angka positif",
        })
        continue
      }
    }

    const tglMasukDate = new Date(tglMasuk)
    if (isNaN(tglMasukDate.getTime())) {
      results.push({
        row: rowNum,
        nik,
        nama,
        noHp,
        jenisKelamin,
        alamat,
        pekerjaan,
        penghasilan,
        tglMasuk,
        isValid: false,
        error: "Tanggal masuk tidak valid (format: YYYY-MM-DD)",
      })
      continue
    }

    parsedRows.push({
      row: rowNum,
      nik,
      nama,
      noHp: noHp || undefined,
      jenisKelamin: jkFormatted,
      alamat,
      pekerjaan: pekerjaan || undefined,
      penghasilan,
      tglMasuk: tglMasukDate,
    })
  }

  // 2nd pass: DB duplication check
  const nikList = parsedRows.map((r) => r.nik)
  const existingNikList = await prisma.anggota.findMany({
    where: { nik: { in: nikList } },
    select: { nik: true },
  })
  const existingNikSet = new Set(existingNikList.map((a) => a.nik))

  for (const row of parsedRows) {
    if (existingNikSet.has(row.nik)) {
      results.push({
        row: row.row,
        nik: row.nik,
        nama: row.nama,
        noHp: row.noHp,
        jenisKelamin: row.jenisKelamin,
        alamat: row.alamat,
        pekerjaan: row.pekerjaan,
        penghasilan: row.penghasilan,
        tglMasuk: row.tglMasuk.toISOString().slice(0, 10),
        isValid: false,
        error: "NIK sudah terdaftar",
      })
    } else {
      results.push({
        row: row.row,
        nik: row.nik,
        nama: row.nama,
        noHp: row.noHp,
        jenisKelamin: row.jenisKelamin,
        alamat: row.alamat,
        pekerjaan: row.pekerjaan,
        penghasilan: row.penghasilan,
        tglMasuk: row.tglMasuk.toISOString().slice(0, 10),
        isValid: true,
      })
    }
  }

  return results.sort((a, b) => a.row - b.row)
}

export type CommitRowResult = {
  row: number
  nik: string
  nama: string
  success: boolean
  error?: string
}

export async function commitImportAnggota(
  rows: {
    row: number
    nik: string
    nama: string
    noHp?: string
    jenisKelamin?: string
    alamat: string
    pekerjaan?: string
    penghasilan: number | null
    tglMasuk: string
  }[],
): Promise<CommitRowResult[]> {
  await assertRole("ADMIN", "PENGURUS", "BENDAHARA")

  const results: CommitRowResult[] = []

  const dateGroups = new Map<
    string,
    {
      row: number
      nik: string
      nama: string
      noHp?: string
      jenisKelamin?: string
      alamat: string
      pekerjaan?: string
      penghasilan: number | null
      tglMasuk: Date
    }[]
  >()

  for (const row of rows) {
    const tglMasukDate = new Date(row.tglMasuk)
    const key = tglMasukDate.toISOString().slice(0, 10)
    const group = dateGroups.get(key) ?? []
    group.push({ ...row, tglMasuk: tglMasukDate })
    dateGroups.set(key, group)
  }

  await prisma.$transaction(
    async (tx) => {
      for (const [, group] of dateGroups) {
        const tgl = group[0]!.tglMasuk
        tgl.setHours(0, 0, 0, 0)
        const nextDay = new Date(tgl)
        nextDay.setDate(nextDay.getDate() + 1)

        let urutan =
          (await tx.anggota.count({
            where: { tglMasuk: { gte: tgl, lt: nextDay } },
          })) + 1

        for (const row of group) {
          try {
            const noAnggota = generateNoAnggota(row.tglMasuk, urutan)
            urutan++
            await tx.anggota.create({
              data: {
                nik: row.nik,
                noAnggota,
                nama: row.nama,
                noHp: row.noHp || null,
                jenisKelamin: row.jenisKelamin || null,
                alamat: row.alamat,
                pekerjaan: row.pekerjaan || null,
                penghasilan: row.penghasilan,
                tglMasuk: row.tglMasuk,
                status: "AKTIF",
              },
            })
            results.push({ row: row.row, nik: row.nik, nama: row.nama, success: true })
          } catch (err) {
            results.push({
              row: row.row,
              nik: row.nik,
              nama: row.nama,
              success: false,
              error: "Gagal menyimpan data",
            })
          }
        }
      }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )

  revalidatePath("/pengurus/anggota")
  return results
}
