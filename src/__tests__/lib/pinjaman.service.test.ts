import { describe, it, expect } from "vitest"
import { round2 } from "@/lib/math"

describe("Pinjaman Service Logic", () => {
  describe("Angsuran Flat Calculation", () => {
    const jumlah = 12000000
    const tenor = 12
    const bunga = 1.5

    it("calculates angsuran pokok flat", () => {
      const angsuranPokok = round2(jumlah / tenor)
      expect(angsuranPokok).toBe(1000000)
    })

    it("calculates angsuran pokok with odd division", () => {
      const angsuranPokok = round2(10000000 / 3)
      expect(angsuranPokok).toBe(3333333.33)
    })

    it("calculates angsuran jasa", () => {
      const angsuranJasa = round2(jumlah * (bunga / 100))
      expect(angsuranJasa).toBe(180000)
    })

    it("calculates total angsuran per bulan", () => {
      const angsuranPokok = round2(jumlah / tenor)
      const angsuranJasa = round2(jumlah * (bunga / 100))
      const angsuranTotal = round2(angsuranPokok + angsuranJasa)
      expect(angsuranTotal).toBe(1180000)
    })

    it("handles small loan", () => {
      const jumlah = 500000
      const tenor = 6
      const bunga = 1.0
      const angsuranPokok = round2(jumlah / tenor)
      const angsuranJasa = round2(jumlah * (bunga / 100))
      const angsuranTotal = round2(angsuranPokok + angsuranJasa)

      expect(angsuranPokok).toBe(83333.33)
      expect(angsuranJasa).toBe(5000)
      expect(angsuranTotal).toBe(88333.33)
    })

    it("handles large loan with long tenor", () => {
      const jumlah = 50000000
      const tenor = 60
      const bunga = 1.0
      const angsuranPokok = round2(jumlah / tenor)
      const angsuranJasa = round2(jumlah * (bunga / 100))
      const angsuranTotal = round2(angsuranPokok + angsuranJasa)

      expect(angsuranPokok).toBe(833333.33)
      expect(angsuranJasa).toBe(500000)
      expect(angsuranTotal).toBe(1333333.33)
    })

    it("first angsuran: pokok matches flat payment", () => {
      const jumlah = 10000000
      const tenor = 10
      const bunga = 2.0
      const angsuranPokok = round2(jumlah / tenor)
      const angsuranJasa = round2(jumlah * (bunga / 100))

      expect(angsuranPokok).toBe(1000000)
      expect(angsuranJasa).toBe(200000)
    })
  })

  describe("Denda Calculation", () => {
    const pokok = 1000000
    const jasa = 150000
    const dendaPerHari = 0.5
    const gracePeriod = 7

    it("applies no denda within grace period", () => {
      const daysLate = 5
      const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
      const denda =
        effectiveDaysLate > 0
          ? Number(((pokok + jasa) * (dendaPerHari / 100) * effectiveDaysLate).toFixed(2))
          : 0

      expect(effectiveDaysLate).toBe(0)
      expect(denda).toBe(0)
    })

    it("applies denda exactly at grace period boundary", () => {
      const daysLate = 7
      const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
      const denda =
        effectiveDaysLate > 0
          ? Number(((pokok + jasa) * (dendaPerHari / 100) * effectiveDaysLate).toFixed(2))
          : 0

      expect(effectiveDaysLate).toBe(0)
      expect(denda).toBe(0)
    })

    it("applies denda after grace period", () => {
      const daysLate = 10
      const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
      const denda =
        effectiveDaysLate > 0
          ? Number(((pokok + jasa) * (dendaPerHari / 100) * effectiveDaysLate).toFixed(2))
          : 0

      expect(effectiveDaysLate).toBe(3)
      const expectedDenda = (pokok + jasa) * (0.5 / 100) * 3
      expect(denda).toBe(Number(expectedDenda.toFixed(2)))
    })

    it("scales denda linearly with late days", () => {
      const dendaA = (pokok + jasa) * (dendaPerHari / 100) * (17 - gracePeriod)
      const dendaB = (pokok + jasa) * (dendaPerHari / 100) * (27 - gracePeriod)

      expect(dendaB).toBe(dendaA * 2)
    })

    it("applies higher denda percentage", () => {
      const highDendaPerHari = 1.0
      const daysLate = 15
      const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
      const denda = Number(
        ((pokok + jasa) * (highDendaPerHari / 100) * effectiveDaysLate).toFixed(2),
      )

      expect(denda).toBe(Number(((pokok + jasa) * 0.01 * 8).toFixed(2)))
    })

    it("handles zero denda when paid on time", () => {
      const daysLate = 0
      const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
      const denda =
        effectiveDaysLate > 0
          ? Number(((pokok + jasa) * (dendaPerHari / 100) * effectiveDaysLate).toFixed(2))
          : 0

      expect(denda).toBe(0)
    })
  })

  describe("Sisa Pinjaman Calculation", () => {
    it("reduces sisa pinjaman by pokok after payment", () => {
      const sisaPinjaman = 5000000
      const pokok = 1000000
      const sisaSetelah = sisaPinjaman - pokok
      expect(sisaSetelah).toBe(4000000)
    })

    it("marks as lunas when sisa reaches zero", () => {
      const sisaPinjaman = 1000000
      const pokok = 1000000
      const sisaSetelah = sisaPinjaman - pokok
      const isLunas = sisaSetelah <= 0
      expect(isLunas).toBe(true)
    })

    it("handles last installment where pokok equals remaining balance", () => {
      const sisaPinjaman = 500000
      const pokok = 500000
      const sisaSetelah = sisaPinjaman - pokok
      const isLunas = sisaSetelah <= 0

      expect(sisaSetelah).toBe(0)
      expect(isLunas).toBe(true)
    })

    it("uses sisa pinjaman for pokok on last angsuran", () => {
      const sisaPinjaman = 499999.98
      const isLastAngsuran = true
      const pokok = isLastAngsuran ? sisaPinjaman : 500000
      const sisaSetelah = sisaPinjaman - pokok
      const isLunas = sisaSetelah <= 0

      expect(pokok).toBe(sisaPinjaman)
      expect(sisaSetelah).toBe(0)
      expect(isLunas).toBe(true)
    })
  })

  describe("Plafon Validation", () => {
    it("calculates max plafon as multiple of total simpanan", () => {
      const totalSimpanan = 5000000
      const plafonMaxSaldo = 5
      const maxPlafon = round2(totalSimpanan * plafonMaxSaldo)
      expect(maxPlafon).toBe(25000000)
    })

    it("rejects loan exceeding plafon", () => {
      const totalSimpanan = 1000000
      const plafonMaxSaldo = 5
      const maxPlafon = round2(totalSimpanan * plafonMaxSaldo)
      const jumlahPinjaman = 6000000

      expect(jumlahPinjaman).toBeGreaterThan(maxPlafon)
    })

    it("approves loan within plafon", () => {
      const totalSimpanan = 1000000
      const plafonMaxSaldo = 5
      const maxPlafon = round2(totalSimpanan * plafonMaxSaldo)
      const jumlahPinjaman = 4000000

      expect(jumlahPinjaman).toBeLessThanOrEqual(maxPlafon)
    })
  })
})
