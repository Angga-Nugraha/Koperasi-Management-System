/**
 * @file src/lib/utils/file.ts
 * @description Helper untuk penanganan file dan upload dokumen.
 */

import { rename, unlink } from "fs/promises"
import path from "path"

export async function deleteOrphanFiles(urls: (string | null | undefined)[]) {
  for (const url of urls) {
    if (!url) continue
    try {
      const filePath = path.join(process.cwd(), "public", url)
      await unlink(filePath)
    } catch {
    }
  }
}

export async function renameAnggotaFile(
  url: string | null | undefined,
  noAnggota: string,
): Promise<string | null> {
  if (!url) return null
  const oldPath = path.join(process.cwd(), "public", url)
  const ext = path.extname(oldPath)
  const dir = path.dirname(oldPath)
  const type = url.startsWith("/uploads/anggota/foto/") ? "foto" : "ktp"
  const newFilename = `${type}-${noAnggota}${ext}`
  const newPath = path.join(dir, newFilename)
  if (oldPath === newPath) return url
  try {
    await rename(oldPath, newPath)
  } catch {
    return url
  }
  return `/uploads/anggota/${type}/${newFilename}`
}
