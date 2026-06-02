const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const hasConfig = Object.values(firebaseConfig).every(Boolean)

export async function getMessagingClient() {
  if (typeof window === "undefined" || !hasConfig) return null
  const { initializeApp, getApps } = await import("firebase/app")
  const { getMessaging } = await import("firebase/messaging")
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!
  return getMessaging(app)
}
