/**
 * @file src/lib/utils/file.ts
 * @description Helper untuk penanganan file dan upload dokumen.
 */

import { unlink } from "fs/promises"
import path from "path"

export async function deleteOrphanFiles(urls: (string | null | undefined)[]) {
  for (const url of urls) {
    if (!url) continue
    try {
      const filePath = path.join(process.cwd(), "public", url)
      await unlink(filePath)
    } catch {
      // file already gone or not found — ignore
    }
  }
}
