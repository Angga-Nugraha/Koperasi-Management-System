"use client"

/**
 * @file src/app/login/page.tsx
 * @description Modul fungsionalitas: page.tsx.
 */

import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [namaKoperasi, setNamaKoperasi] = useState("Simko")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      const saved = localStorage.getItem("login_remember")
      if (!saved) return false
      const p = JSON.parse(saved)
      return !!p.email
    } catch {
      return false
    }
  })

  useEffect(() => {
    fetch("/api/general-info")
      .then((r) => r.json())
      .then((info) => {
        if (info?.namaKoperasi) setNamaKoperasi(info.namaKoperasi)
        if (info?.logo) setLogoUrl(info.logo)
      })
      .catch(() => {})
    const saved = localStorage.getItem("login_remember")
    if (saved) {
      try {
        const { email, password } = JSON.parse(saved)
        if (email) {
          const emailInput = document.getElementById("email") as HTMLInputElement
          const passwordInput = document.getElementById("password") as HTMLInputElement
          if (emailInput) emailInput.value = email
          if (password && passwordInput) passwordInput.value = password
        }
      } catch {}
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email atau password salah")
      setLoading(false)
      return
    }

    if (rememberMe) {
      localStorage.setItem("login_remember", JSON.stringify({ email, password }))
    } else {
      localStorage.removeItem("login_remember")
    }

    router.push("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center space-y-4 pt-8">
          <img
            src={logoUrl || "/logo.png"}
            alt="Logo Koperasi"
            className="h-28 w-32 rounded-xl object-contain p-1"
          />
          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl text-primary">{namaKoperasi}</CardTitle>
            <CardDescription>Sistem Manajemen Koperasi</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="email@mail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              Ingat Saya
            </label>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
