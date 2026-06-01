import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    switch (session.user.role) {
      case "ADMIN":
      case "PENGURUS":
      case "BENDAHARA":
        redirect("/pengurus")
      case "ANGGOTA":
        redirect("/anggota")
      case "PENGAWAS":
        redirect("/pengawas")
    }
  }

  redirect("/login")
}
