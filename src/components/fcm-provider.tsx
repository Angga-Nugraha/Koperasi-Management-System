"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

export function FcmProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const initialized = useRef(false)
  const userId = session?.user?.id

  useEffect(() => {
    if (!userId || initialized.current) return
    if (typeof window === "undefined" || !("Notification" in window)) return

    initialized.current = true

    async function init() {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY
        if (!vapidKey) return

        const { getToken, onMessage } = await import("firebase/messaging")
        const { getMessagingClient } = await import("@/lib/firebase-client")
        const messaging = await getMessagingClient()
        if (!messaging) return

        const token = await getToken(messaging, { vapidKey })
        await fetch("/api/fcm/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        })

        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration()
          if (!reg) {
            await navigator.serviceWorker.register("/firebase-messaging-sw.js")
          }
        }

        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification ?? {}
          const data = payload.data as Record<string, string> | undefined
          const event = new CustomEvent("firebase-push", {
            detail: { title, body, ...data },
          })
          window.dispatchEvent(event)
        })
      } catch {
        // silent
      }
    }

    init()
  }, [userId])

  // Re-init on user change
  useEffect(() => {
    initialized.current = false
  }, [userId])

  return <>{children}</>
}
