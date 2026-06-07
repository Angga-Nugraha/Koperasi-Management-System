/**
 * @file src/lib/firebase-admin.ts
 * @description Inisialisasi Firebase Admin SDK untuk pengiriman push notification dari sisi server.
 */

import admin from "firebase-admin"

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export const fcm = admin.messaging()
export default admin
