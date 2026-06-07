/**
 * @file src/lib/math.ts
 * @description Helper operasi matematika finansial dengan presisi tinggi menggunakan decimal.js.
 */

import Decimal from "decimal.js"

export function round2(value: number): number {
  return new Decimal(value).toDP(2).toNumber()
}

export function add(a: number, b: number): number {
  return new Decimal(a).plus(b).toNumber()
}

export function sub(a: number, b: number): number {
  return new Decimal(a).minus(b).toNumber()
}

export function mul(a: number, b: number): number {
  return new Decimal(a).times(b).toNumber()
}

export function div(a: number, b: number): number {
  return new Decimal(a).div(b).toNumber()
}
