export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  const code = `
importScripts("https://www.gstatic.com/firebasejs/11.x/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/11.x/firebase-messaging-compat.js")

firebase.initializeApp({
  apiKey: ${JSON.stringify(apiKey)},
  authDomain: ${JSON.stringify(authDomain)},
  projectId: ${JSON.stringify(projectId)},
  storageBucket: ${JSON.stringify(storageBucket)},
  messagingSenderId: ${JSON.stringify(messagingSenderId)},
  appId: ${JSON.stringify(appId)},
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {}
  const data = payload.data ?? {}
  const options = {
    body: body ?? "",
    icon: "/logo.png",
    badge: "/logo.png",
    data,
  }
  self.registration.showNotification(title ?? "Notifikasi", options)
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const relatedId = event.notification.data?.relatedId
  const type = event.notification.data?.type
  const role = event.notification.data?.role
  const isAnggota = role === "ANGGOTA"
  let url = "/"
  if (type === "SETORAN" || type === "TAGIHAN") {
    url = isAnggota ? "/anggota/simpanan" : "/pengurus/simpanan"
  } else if (["PENGAJUAN","DISETUJUI","DITOLAK","DICAIKKAN"].includes(type ?? "")) {
    url = isAnggota ? "/anggota/pinjaman" : (relatedId ? "/pengurus/pinjaman/" + relatedId : "/pengurus/pinjaman")
  }
  event.waitUntil(clients.openWindow(url))
})
`.trim()

  return new Response(code, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "no-store",
    },
  })
}
