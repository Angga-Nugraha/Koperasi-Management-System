import { NextResponse } from "next/server"
import { getKonfig } from "@/lib/konfig"

export const dynamic = "force-dynamic"

export async function GET() {
  const konfig = await getKonfig()
  return NextResponse.json(konfig)
}
