/**
 * @file src/lib/utils.ts
 * @description Helper utilitas umum seperti penggabungan class Tailwind (cn).
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
