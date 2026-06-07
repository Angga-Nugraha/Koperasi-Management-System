/**
 * @file src/app/api/konfig/route.ts
 * @description Route Handler API untuk endpoint /api/konfig/route.ts
 */

import { NextResponse } from "next/server"
import { getKonfig } from "@/lib/konfig"

export const dynamic = "force-dynamic"

export async function GET() {
  const konfig = await getKonfig()
  return NextResponse.json(konfig)
}
