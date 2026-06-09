/**
 * @file src/lib/firebase-admin.ts
 * @description Inisialisasi Firebase Admin SDK untuk pengiriman push notification dari sisi server.
 * Lazy initialization — hanya inisialisasi saat runtime, bukan saat import.
 */

import admin from "firebase-admin"

function getApp() {
  if (admin.apps.length) return admin
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    })
  } catch {
    // Firebase tidak tersedia (build time / dev tanpa credential)
  }
  return admin
}

const app = getApp()

export function getFcm() {
  if (!app.apps.length) {
    throw new Error("Firebase tidak terkonfigurasi")
  }
  return app.messaging()
}

export default app
