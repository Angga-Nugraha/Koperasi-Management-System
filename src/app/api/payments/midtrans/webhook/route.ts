/**
 * @file src/app/api/payments/midtrans/webhook/route.ts
 * @description Route Handler API untuk endpoint /api/payments/midtrans/webhook/route.ts
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createHash } from "crypto"
import { prosesSuksesPaymentInternal } from "@/actions/online-payment"

// Simple in-memory idempotency store with 5 min TTL
const processedTransactions = new Map<string, number>()
const IDEMPOTENCY_TTL = 5 * 60 * 1000

function isAlreadyProcessed(transactionId: string): boolean {
  const ts = processedTransactions.get(transactionId)
  if (ts && Date.now() - ts < IDEMPOTENCY_TTL) return true
  processedTransactions.set(transactionId, Date.now())
  return false
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      payment_type,
      transaction_id,
    } = body

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      console.error("Webhook Error: MIDTRANS_SERVER_KEY is not configured.")
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })
    }

    const signatureString = order_id + status_code + gross_amount + serverKey
    const computedSignature = createHash("sha512").update(signatureString).digest("hex")

    if (computedSignature !== signature_key) {
      console.warn(`Webhook Error: Invalid signature for Order ID ${order_id}.`)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Idempotency check: skip if this transaction_id was already processed
    if (transaction_id && isAlreadyProcessed(transaction_id)) {
      return NextResponse.json({ success: true })
    }

    const trxOnline = await prisma.transaksiOnline.findUnique({
      where: { orderId: order_id },
    })

    if (!trxOnline) {
      console.warn(`Webhook Error: Transaction ${order_id} not found in database.`)
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Database-level idempotency: if already success, skip
    if (trxOnline.status === "SUCCESS") {
      return NextResponse.json({ success: true })
    }

    const isSuccess = ["settlement", "capture"].includes(transaction_status)
    const isFailed = ["deny", "cancel", "expire"].includes(transaction_status)

    if (isSuccess) {
      await prosesSuksesPaymentInternal(trxOnline.id, payment_type || "online")
      console.log(`Webhook Success: Order ID ${order_id} marked as SUCCESS.`)
    } else if (isFailed && trxOnline.status === "PENDING") {
      await prisma.transaksiOnline.update({
        where: { id: trxOnline.id },
        data: { status: transaction_status === "expire" ? "EXPIRED" : "FAILED" },
      })
      console.log(`Webhook Failed: Order ID ${order_id} marked as ${transaction_status.toUpperCase()}.`)
    }

    return NextResponse.json({ success: true })
  } catch {
    console.error("Webhook Error Handler: Internal server error")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
