/**
 * @file src/app/api/konfig/route.ts
 * @description Route Handler API untuk endpoint /api/konfig/route.ts
 */

import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getKonfig } from "@/lib/konfig"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const konfig = await getKonfig()
  return NextResponse.json(konfig)
}
