/**
 * @file src/lib/__tests__/utils.anggota.test.ts
 * @description Unit test untuk menguji fungsionalitas utils.anggota.
 */

import { describe, it, expect } from "vitest"
import { generateNoAnggota } from "@/lib/utils/anggota"

describe("generateNoAnggota", () => {
  it("generates a member number with correct format", () => {
    const date = new Date(2024, 5, 15)
    const no = generateNoAnggota(date, 1)
    expect(no).toMatch(/^AGT2406150001-[A-F0-9]{4}$/)
  })

  it("pads sequence number to 4 digits", () => {
    const date = new Date(2024, 0, 1)
    const no = generateNoAnggota(date, 42)
    expect(no).toMatch(/^AGT2401010042-[A-F0-9]{4}$/)
  })

  it("handles large sequence numbers", () => {
    const date = new Date(2024, 11, 31)
    const no = generateNoAnggota(date, 9999)
    expect(no).toMatch(/^AGT2412319999-[A-F0-9]{4}$/)
  })

  it("generates unique suffix on each call", () => {
    const date = new Date(2024, 0, 1)
    const no1 = generateNoAnggota(date, 1)
    const no2 = generateNoAnggota(date, 2)
    expect(no1).not.toBe(no2)
  })
})
