/**
 * @file src/lib/excel.ts
 * @description Utilitas untuk sanitasi data dan pembuatan file spreadsheet/Excel.
 */

export function sanitizeCellValue(value: string | number | null | undefined): string | number {
  if (typeof value === "string" && /^[=+\-@]/.test(value)) {
    return `'${value}`
  }
  return value ?? ""
}
