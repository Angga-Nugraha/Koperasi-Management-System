import { describe, it, expect } from "vitest"
import { round2, add, sub, mul, div } from "@/lib/math"

describe("math utilities", () => {
  describe("round2", () => {
    it("rounds to 2 decimal places", () => {
      expect(round2(10.456)).toBe(10.46)
    })

    it("rounds down correctly", () => {
      expect(round2(10.454)).toBe(10.45)
    })

    it("handles integers", () => {
      expect(round2(100)).toBe(100)
    })

    it("handles zero", () => {
      expect(round2(0)).toBe(0)
    })

    it("handles negative numbers", () => {
      expect(round2(-10.456)).toBe(-10.46)
    })

    it("handles very small numbers", () => {
      expect(round2(0.001)).toBe(0)
    })

    it("avoids floating point precision errors", () => {
      expect(round2(0.1 + 0.2)).toBe(0.3)
    })
  })

  describe("add", () => {
    it("adds two numbers", () => {
      expect(add(10, 20)).toBe(30)
    })

    it("handles decimal addition without precision loss", () => {
      expect(add(0.1, 0.2)).toBe(0.3)
    })

    it("handles negative numbers", () => {
      expect(add(-5, 10)).toBe(5)
    })
  })

  describe("sub", () => {
    it("subtracts two numbers", () => {
      expect(sub(30, 10)).toBe(20)
    })

    it("handles decimal subtraction without precision loss", () => {
      expect(sub(0.3, 0.1)).toBe(0.2)
    })

    it("handles negative result", () => {
      expect(sub(10, 20)).toBe(-10)
    })
  })

  describe("mul", () => {
    it("multiplies two numbers", () => {
      expect(mul(10, 20)).toBe(200)
    })

    it("handles decimal multiplication without precision loss", () => {
      expect(mul(0.1, 0.2)).toBe(0.02)
    })

    it("handles zero", () => {
      expect(mul(10, 0)).toBe(0)
    })
  })

  describe("div", () => {
    it("divides two numbers", () => {
      expect(div(10, 3)).toBeCloseTo(3.3333, 4)
    })

    it("handles zero numerator", () => {
      expect(div(0, 10)).toBe(0)
    })

    it("handles division by 1", () => {
      expect(div(10, 1)).toBe(10)
    })

    it("handles decimal result", () => {
      expect(div(1, 3)).toBeCloseTo(0.3333, 4)
    })
  })
})
