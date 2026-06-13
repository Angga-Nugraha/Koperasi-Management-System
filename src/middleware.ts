import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  if (pathname.startsWith("/login")) return

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (pathname.startsWith("/pengurus") && session.user.role === "ANGGOTA") {
    return NextResponse.redirect(new URL("/anggota", req.url))
  }

  if (pathname.startsWith("/anggota") && session.user.role !== "ANGGOTA") {
    return NextResponse.redirect(new URL("/pengurus", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|api/health|api/jenis-simpanan|api/general-info|monitoring).*)"],
}
