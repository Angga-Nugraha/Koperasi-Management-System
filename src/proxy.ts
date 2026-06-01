import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const ROLE_ROUTES: Record<string, string[]> = {
  ADMIN: ["/pengurus", "/profile"],
  PENGURUS: ["/pengurus", "/profile"],
  BENDAHARA: ["/pengurus", "/profile"],
  ANGGOTA: ["/anggota", "/profile"],
  PENGAWAS: ["/pengawas", "/profile"],
}

const PUBLIC_ROUTES = ["/login", "/"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  )

  if (isPublic) {
    if (session?.user && pathname === "/login") {
      return NextResponse.redirect(new URL(getDashboardRoute(session.user.role as string), req.url))
    }
    return NextResponse.next()
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role as string
  const allowedRoutes = ROLE_ROUTES[role]
  if (!allowedRoutes) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route))
  if (!hasAccess) {
    return NextResponse.redirect(new URL(getDashboardRoute(role), req.url))
  }

  return NextResponse.next()
})

function getDashboardRoute(role: string): string {
  switch (role) {
    case "ADMIN":
    case "PENGURUS":
    case "BENDAHARA":
      return "/pengurus"
    case "ANGGOTA":
      return "/anggota"
    case "PENGAWAS":
      return "/pengawas"
    default:
      return "/login"
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|uploads|favicon.ico).*)"],
}
