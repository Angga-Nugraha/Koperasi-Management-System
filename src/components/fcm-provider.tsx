"use client"

/**
 * @file src/components/fcm-provider.tsx
 * @description Komponen presentasional / interaktif: fcm-provider.
 */

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

// Provider untuk inisialisasi Firebase Cloud Messaging (FCM) dan pendaftaran token perangkat pengguna.
export function FcmProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const initialized = useRef(false)
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId || initialized.current) return
    if (typeof window === "undefined" || !("Notification" in window)) return

    async function init() {
      try {
        // Meminta izin notifikasi dari pengguna
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY
        if (!vapidKey) return

        // Mendaftarkan service worker secara eksplisit untuk menangani push message di background
        let reg: ServiceWorkerRegistration | undefined
        if ("serviceWorker" in navigator) {
          reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js")
        }

        const { getToken, onMessage } = await import("firebase/messaging")
        const { getMessagingClient } = await import("@/lib/firebase-client")
        const messaging = await getMessagingClient()
        if (!messaging) return

        // Mengambil token FCM dengan meneruskan registrasi service worker yang telah dibuat
        const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg })
        await fetch("/api/fcm/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        // Mendengarkan pesan masuk saat aplikasi dalam keadaan aktif (foreground)
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {}
          const data = payload.data as Record<string, string> | undefined
          const event = new CustomEvent("firebase-push", {
            detail: { title, body, ...data },
          })
          window.dispatchEvent(event)
        })

        initialized.current = true
      } catch (err: any) {
        // Menangani kasus di mana layanan push bawaan browser tidak tersedia (misal di lingkungan headless/sandbox/tanpa Google Play)
        if (err?.name === "AbortError" || err?.message?.includes("push service error")) {
          console.warn("FCM push service is not available in this environment.")
        } else {
          console.error("FCM initialization error:", err)
        }
      }
    }

    init()
  }, [userId])

  // Reset on user change to allow re-init
  useEffect(() => {
    initialized.current = false
  }, [userId])

  return <>{children}</>
}
