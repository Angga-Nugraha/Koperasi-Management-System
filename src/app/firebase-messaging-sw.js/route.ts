/**
 * @file src/app/firebase-messaging-sw.js/route.ts
 * @description Modul fungsionalitas: route.ts.
 */

// Route handler Next.js untuk menyajikan file Service Worker Firebase Cloud Messaging (FCM) secara dinamis.
// Ini memungkinkan kita menyisipkan kredensial Firebase dari env server ke dalam script klien secara langsung.
export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID

  const code = `
// Mengimpor library Firebase App dan Messaging versi compat (v9/v10) melalui CDN.
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js")

// Inisialisasi Firebase di dalam scope Service Worker.
firebase.initializeApp({
  apiKey: ${JSON.stringify(apiKey)},
  authDomain: ${JSON.stringify(authDomain)},
  projectId: ${JSON.stringify(projectId)},
  storageBucket: ${JSON.stringify(storageBucket)},
  messagingSenderId: ${JSON.stringify(messagingSenderId)},
  appId: ${JSON.stringify(appId)},
})

const messaging = firebase.messaging()

// Event listener untuk menangkap push notification saat aplikasi berada di background / ditutup.
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

// Event listener ketika notifikasi diklik oleh pengguna.
// Akan mengarahkan (redirect) pengguna ke halaman yang relevan berdasarkan tipe transaksi/pesan.
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const relatedId = event.notification.data?.relatedId
  const type = event.notification.data?.type
  const role = event.notification.data?.role
  const isAnggota = role === "ANGGOTA"
  let url = "/"
  if (type === "SETORAN" || type === "TAGIHAN") {
    url = isAnggota ? "/anggota/simpanan" : "/pengurus/simpanan"
  } else if (["PENGAJUAN","DISETUJUI","DITOLAK","DICAIRKAN"].includes(type ?? "")) {
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
