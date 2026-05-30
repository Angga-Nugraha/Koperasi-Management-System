import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const info = await prisma.generalInfo.findFirst()
  return NextResponse.json(info)
}
