/**
 * @file src/actions/online-payment.ts
 * @description Server Action untuk integrasi pembayaran online menggunakan Midtrans.
 */

"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import {
  buatJurnal,
  COA_BANK,
  getSimpananAkun,
  COA_PIUTANG_PINJAMAN,
  COA_PENDAPATAN_JASA,
  COA_PENDAPATAN_DENDA,
} from "@/lib/jurnal"
import {
  generateNoStrukTagihan,
  generateNoStrukSimpanan,
  generateNoStrukAngsuran,
} from "@/lib/struk"
import { getKonfig, getNumber } from "@/lib/konfig"
import { notifyAdmins, notifyMember } from "@/lib/notifikasi"
import crypto from "crypto"

const MIDTRANS_TIMEOUT = 15_000

const paymentRateLimit = new Map<string, { count: number; resetAt: number }>()
const PAYMENT_RATE_LIMIT_MAX = 5
const PAYMENT_RATE_LIMIT_WINDOW = 60_000

function checkPaymentRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = paymentRateLimit.get(userId)
  if (!entry || now > entry.resetAt) {
    paymentRateLimit.set(userId, { count: 1, resetAt: now + PAYMENT_RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= PAYMENT_RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

async function midtransFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), MIDTRANS_TIMEOUT)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// Helper to load Midtrans credentials
function getMidtransConfig() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? ""
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""
  const isProd = process.env.MIDTRANS_IS_PRODUCTION === "true"

  const snapUrl = isProd
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1"

  const coreUrl = isProd ? "https://api.midtrans.com/v2" : "https://api.sandbox.midtrans.com/v2"

  return { serverKey, clientKey, snapUrl, coreUrl }
}

export async function createOnlinePayment({
  tipe,
  relatedId,
  nominalInput,
}: {
  tipe: "TAGIHAN_WAJIB" | "ANGSURAN" | "SIMPANAN_SUKARELA"
  relatedId?: string
  nominalInput?: number
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ANGGOTA") {
    throw new Error("Unauthorized")
  }

  const anggotaId = session.user.anggotaId
  if (!anggotaId) {
    throw new Error("Akun ini tidak terhubung ke data anggota.")
  }

  if (!checkPaymentRateLimit(session.user.id)) {
    throw new Error("Terlalu banyak permintaan pembayaran. Coba lagi dalam 1 menit.")
  }

  const anggota = await prisma.anggota.findUnique({
    where: { id: anggotaId },
  })
  if (!anggota) {
    throw new Error("Data anggota tidak ditemukan.")
  }

  let nominal = 0
  let description = ""

  // 1. Validation & nominal calculation
  if (tipe === "TAGIHAN_WAJIB") {
    if (!relatedId) throw new Error("ID Tagihan diperlukan")

    const tagihan = await prisma.tagihanSimpanan.findUnique({
      where: { id: relatedId },
      include: { jenisSimpanan: true },
    })

    if (!tagihan) throw new Error("Tagihan tidak ditemukan")
    if (tagihan.status === "LUNAS") throw new Error("Tagihan sudah lunas")

    // Anti-spam validation: check for active pending payment
    const existingPending = await prisma.transaksiOnline.findFirst({
      where: {
        relatedId,
        tipe: "TAGIHAN_WAJIB",
        status: "PENDING",
        expiredAt: { gte: new Date() },
      },
    })

    if (existingPending) {
      return {
        success: false,
        code: "PENDING_PAYMENT_EXISTS",
        message:
          "Anda memiliki pembayaran pending untuk tagihan ini. Silakan selesaikan pembayaran tersebut.",
        data: {
          snapToken: existingPending.snapToken,
          snapUrl: existingPending.snapUrl,
          orderId: existingPending.orderId,
          expiredAt: existingPending.expiredAt.toISOString(),
        },
      }
    }

    nominal = Number(tagihan.nominal)
    description = `Bayar ${tagihan.jenisSimpanan.nama} ${tagihan.bulan}/${tagihan.tahun}`
  } else if (tipe === "ANGSURAN") {
    if (!relatedId) throw new Error("ID Angsuran diperlukan")

    const angsuran = await prisma.angsuran.findUnique({
      where: { id: relatedId },
      include: { pinjaman: true },
    })

    if (!angsuran) throw new Error("Angsuran tidak ditemukan")
    if (angsuran.status === "LUNAS") throw new Error("Angsuran sudah lunas")

    // Anti-spam validation
    const existingPending = await prisma.transaksiOnline.findFirst({
      where: {
        relatedId,
        tipe: "ANGSURAN",
        status: "PENDING",
        expiredAt: { gte: new Date() },
      },
    })

    if (existingPending) {
      return {
        success: false,
        code: "PENDING_PAYMENT_EXISTS",
        message:
          "Anda memiliki pembayaran pending untuk angsuran ini. Silakan selesaikan pembayaran tersebut.",
        data: {
          snapToken: existingPending.snapToken,
          snapUrl: existingPending.snapUrl,
          orderId: existingPending.orderId,
          expiredAt: existingPending.expiredAt.toISOString(),
        },
      }
    }

    // Calculate denda & total
    const konfig = await getKonfig()
    const dendaPerHari = getNumber(konfig, "denda_per_hari", 0.5)
    const gracePeriod = getNumber(konfig, "grace_period", 7)
    const tglBayar = new Date()
    const daysLate = Math.max(
      0,
      Math.floor((tglBayar.getTime() - angsuran.jatuhTempo.getTime()) / (1000 * 60 * 60 * 24)),
    )
    const effectiveDaysLate = Math.max(0, daysLate - gracePeriod)
    const denda =
      effectiveDaysLate > 0
        ? Number(
            (
              (Number(angsuran.pokok) + Number(angsuran.jasa)) *
              (dendaPerHari / 100) *
              effectiveDaysLate
            ).toFixed(2),
          )
        : 0

    nominal = Number(angsuran.pokok) + Number(angsuran.jasa) + denda
    description = `Bayar Angsuran Ke-${angsuran.angsuranKe} Pinjaman`
  } else if (tipe === "SIMPANAN_SUKARELA") {
    if (!nominalInput || nominalInput <= 0) {
      throw new Error("Nominal setoran sukarela tidak valid")
    }

    const jenisSukarela = await prisma.jenisSimpanan.findFirst({
      where: { kode: "SUKARELA" },
    })
    if (!jenisSukarela) throw new Error("Jenis simpanan Sukarela tidak ditemukan")
    if (nominalInput < Number(jenisSukarela.minimalSetoran)) {
      throw new Error(
        `Minimal setoran Sukarela adalah Rp${Number(jenisSukarela.minimalSetoran).toLocaleString("id-ID")}`,
      )
    }

    // Check if there is an active pending transaction for sukarela in the last 15 mins for the same amount (spam guard)
    const recentPending = await prisma.transaksiOnline.findFirst({
      where: {
        anggotaId,
        tipe: "SIMPANAN_SUKARELA",
        nominal: nominalInput,
        status: "PENDING",
        expiredAt: { gte: new Date() },
      },
    })

    if (recentPending) {
      return {
        success: false,
        code: "PENDING_PAYMENT_EXISTS",
        message:
          "Anda memiliki setoran sukarela pending dengan nominal yang sama. Silakan selesaikan atau tunggu.",
        data: {
          snapToken: recentPending.snapToken,
          snapUrl: recentPending.snapUrl,
          orderId: recentPending.orderId,
          expiredAt: recentPending.expiredAt.toISOString(),
        },
      }
    }

    nominal = nominalInput
    description = "Setoran Simpanan Sukarela"
  } else {
    throw new Error("Tipe pembayaran tidak valid")
  }

  // 2. Generate Order ID & Expiry
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase()
  const orderId = `TX-${tipe.substring(0, 3)}-${dateStr}-${rand}`
  const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

  // 3. Call Midtrans Snap API
  const { serverKey, snapUrl } = getMidtransConfig()
  if (!serverKey) {
    throw new Error("Midtrans server key is not configured in environment variables.")
  }

  const basicAuth = "Basic " + Buffer.from(serverKey + ":").toString("base64")

  const response = await midtransFetch(`${snapUrl}/transactions`, {
    method: "POST",
    headers: {
      Authorization: basicAuth,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: orderId,
        gross_amount: nominal,
      },
      customer_details: {
        first_name: anggota.nama,
        email: session.user.email ?? undefined,
        phone: anggota.noHp ?? undefined,
      },
      item_details: [
        {
          id: relatedId ?? tipe,
          price: nominal,
          quantity: 1,
          name: description.slice(0, 50),
        },
      ],
      expiry: {
        duration: 24,
        unit: "hours",
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Midtrans Snap Error:", errorText)
    throw new Error("Gagal menginisiasi pembayaran dengan Midtrans. Coba beberapa saat lagi.")
  }

  const midtransRes = await response.json()

  // 4. Save to database
  const trxOnline = await prisma.transaksiOnline.create({
    data: {
      orderId,
      tipe,
      anggotaId,
      relatedId: relatedId ?? null,
      nominal,
      status: "PENDING",
      snapToken: midtransRes.token,
      snapUrl: midtransRes.redirect_url,
      expiredAt,
    },
  })

  revalidatePath("/anggota/simpanan")
  revalidatePath("/anggota/pinjaman")

  return {
    success: true,
    data: {
      snapToken: trxOnline.snapToken,
      snapUrl: trxOnline.snapUrl,
      orderId: trxOnline.orderId,
      expiredAt: expiredAt.toISOString(),
    },
  }
}

const pendingSyncRequests = new Map<string, Promise<{ success: boolean; status: string }>>()

async function syncOnlinePaymentStatusImpl(orderId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { serverKey, coreUrl } = getMidtransConfig()
  if (!serverKey) throw new Error("Midtrans configuration missing")

  // Find local payment
  const trxOnline = await prisma.transaksiOnline.findUnique({
    where: { orderId },
    include: { anggota: true },
  })

  if (!trxOnline) throw new Error("Transaksi tidak ditemukan")
  if (trxOnline.status !== "PENDING") {
    return { success: true, status: trxOnline.status }
  }

  const basicAuth = "Basic " + Buffer.from(serverKey + ":").toString("base64")
  const response = await midtransFetch(`${coreUrl}/${orderId}/status`, {
    headers: {
      Authorization: basicAuth,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const diffMs = Date.now() - trxOnline.createdAt.getTime()
    if (response.status === 404 && diffMs > 60 * 60 * 1000) {
      await prisma.transaksiOnline.update({
        where: { id: trxOnline.id },
        data: { status: "EXPIRED" },
      })
      return { success: true, status: "EXPIRED" }
    }
    throw new Error("Gagal memeriksa status ke Midtrans")
  }

  const statusData = await response.json()
  const transactionStatus = statusData.transaction_status
  const paymentType = statusData.payment_type

  const isSuccess = ["settlement", "capture"].includes(transactionStatus)
  const isFailed = ["deny", "cancel", "expire"].includes(transactionStatus)

  if (isSuccess) {
    await prosesSuksesPaymentInternal(trxOnline.id, paymentType)
    revalidatePath("/anggota/simpanan")
    revalidatePath("/anggota/pinjaman")
    return { success: true, status: "SUCCESS" }
  } else if (isFailed) {
    await prisma.transaksiOnline.update({
      where: { id: trxOnline.id },
      data: { status: "FAILED" },
    })
    revalidatePath("/anggota/simpanan")
    revalidatePath("/anggota/pinjaman")
    return { success: true, status: "FAILED" }
  }

  return { success: true, status: "PENDING" }
}

export async function syncOnlinePaymentStatus(orderId: string) {
  const existing = pendingSyncRequests.get(orderId)
  if (existing) return existing

  const promise = syncOnlinePaymentStatusImpl(orderId).finally(() => {
    pendingSyncRequests.delete(orderId)
  })
  pendingSyncRequests.set(orderId, promise)
  return promise
}

// Shared internal processor for successful online payments
export async function prosesSuksesPaymentInternal(trxOnlineId: string, paymentMethod: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch online transaction
    const trxOnline = await tx.transaksiOnline.findUnique({
      where: { id: trxOnlineId },
      include: { anggota: true },
    })
    if (!trxOnline || trxOnline.status === "SUCCESS") return

    // Update status to success
    await tx.transaksiOnline.update({
      where: { id: trxOnline.id },
      data: { status: "SUCCESS", paymentMethod },
    })

    const nominalNum = Number(trxOnline.nominal)
    let notifType = "SETORAN"
    let notifRelatedId: string | undefined

    if (trxOnline.tipe === "TAGIHAN_WAJIB") {
      notifRelatedId = trxOnline.anggotaId
      const tagihan = await tx.tagihanSimpanan.findUnique({
        where: { id: trxOnline.relatedId! },
        include: { jenisSimpanan: true },
      })
      if (!tagihan || tagihan.status === "LUNAS") return

      const noStruk = await generateNoStrukTagihan()

      const simpanan = await tx.simpanan.upsert({
        where: {
          anggotaId_jenisSimpananId: {
            anggotaId: tagihan.anggotaId,
            jenisSimpananId: tagihan.jenisSimpananId,
          },
        },
        create: {
          anggotaId: tagihan.anggotaId,
          jenisSimpananId: tagihan.jenisSimpananId,
          saldo: tagihan.nominal,
        },
        update: {
          saldo: { increment: tagihan.nominal },
        },
      })

      await tx.transaksiSimpanan.create({
        data: {
          anggotaId: tagihan.anggotaId,
          jenisSimpananId: tagihan.jenisSimpananId,
          tipe: "SETORAN",
          nominal: tagihan.nominal,
          saldoSetelah: Number(simpanan.saldo),
          keterangan: `Pembayaran online tagihan ${tagihan.jenisSimpanan.nama} periode ${tagihan.bulan}/${tagihan.tahun}`,
          noStruk,
        },
      })

      await tx.tagihanSimpanan.update({
        where: { id: tagihan.id },
        data: {
          status: "LUNAS",
          tglBayar: new Date(),
          noStruk,
        },
      })

      const akunSimpanan = getSimpananAkun(tagihan.jenisSimpanan.kode)
      await buatJurnal(tx, {
        tanggal: new Date(),
        keterangan: `Pembayaran online tagihan ${tagihan.jenisSimpanan.nama} ${trxOnline.anggota.noAnggota} - ${trxOnline.anggota.nama} ${tagihan.bulan}/${tagihan.tahun}`,
        entries: [
          { akunKode: COA_BANK, debit: nominalNum, kredit: 0 },
          { akunKode: akunSimpanan, debit: 0, kredit: nominalNum },
        ],
      })
    } else if (trxOnline.tipe === "SIMPANAN_SUKARELA") {
      notifRelatedId = trxOnline.anggotaId
      const jenisSukarela = await tx.jenisSimpanan.findFirst({ where: { kode: "SUKARELA" } })
      if (!jenisSukarela) return

      const noStruk = await generateNoStrukSimpanan()

      const simpanan = await tx.simpanan.upsert({
        where: {
          anggotaId_jenisSimpananId: {
            anggotaId: trxOnline.anggotaId,
            jenisSimpananId: jenisSukarela.id,
          },
        },
        create: {
          anggotaId: trxOnline.anggotaId,
          jenisSimpananId: jenisSukarela.id,
          saldo: trxOnline.nominal,
        },
        update: {
          saldo: { increment: trxOnline.nominal },
        },
      })

      await tx.transaksiSimpanan.create({
        data: {
          anggotaId: trxOnline.anggotaId,
          jenisSimpananId: jenisSukarela.id,
          tipe: "SETORAN",
          nominal: trxOnline.nominal,
          saldoSetelah: Number(simpanan.saldo),
          keterangan: `Setoran online Simpanan Sukarela via Midtrans`,
          noStruk,
        },
      })

      const akunSimpanan = getSimpananAkun("SUKARELA")
      await buatJurnal(tx, {
        tanggal: new Date(),
        keterangan: `Setoran online Simpanan Sukarela ${trxOnline.anggota.noAnggota} - ${trxOnline.anggota.nama}`,
        entries: [
          { akunKode: COA_BANK, debit: nominalNum, kredit: 0 },
          { akunKode: akunSimpanan, debit: 0, kredit: nominalNum },
        ],
      })
    } else if (trxOnline.tipe === "ANGSURAN") {
      const angsuran = await tx.angsuran.findUnique({
        where: { id: trxOnline.relatedId! },
        include: { pinjaman: true },
      })
      if (angsuran) {
        notifType = "ANGSURAN"
        notifRelatedId = angsuran.pinjamanId
      }
      if (!angsuran || angsuran.status === "LUNAS") return

      const pinjaman = angsuran.pinjaman
      const noStruk = await generateNoStrukAngsuran()

      const sisaAngsuran = await tx.angsuran.count({
        where: { pinjamanId: pinjaman.id, status: { in: ["BELUM_LUNAS", "TERLAMBAT"] } },
      })
      const isLastAngsuran = sisaAngsuran === 1
      const pokok = isLastAngsuran ? Number(pinjaman.sisaPinjaman) : Number(angsuran.pokok)
      const jasa = Number(angsuran.jasa)
      const denda = nominalNum - (pokok + jasa)

      const sisaPinjamanSetelah = Number(pinjaman.sisaPinjaman) - pokok
      const isLunas = sisaPinjamanSetelah <= 0

      await tx.angsuran.update({
        where: { id: angsuran.id },
        data: {
          tglBayar: new Date(),
          denda,
          total: trxOnline.nominal,
          status: "LUNAS",
          noStruk,
        },
      })

      await tx.pinjaman.update({
        where: { id: pinjaman.id },
        data: {
          sisaPinjaman: Math.max(0, sisaPinjamanSetelah),
          status: isLunas ? "LUNAS" : pinjaman.status,
        },
      })

      const entries = []
      entries.push({ akunKode: COA_BANK, debit: nominalNum, kredit: 0 })
      if (pokok > 0) entries.push({ akunKode: COA_PIUTANG_PINJAMAN, debit: 0, kredit: pokok })
      if (jasa > 0) entries.push({ akunKode: COA_PENDAPATAN_JASA, debit: 0, kredit: jasa })
      if (denda > 0) entries.push({ akunKode: COA_PENDAPATAN_DENDA, debit: 0, kredit: denda })

      await buatJurnal(tx, {
        tanggal: new Date(),
        keterangan: `Bayar Angsuran #${angsuran.angsuranKe} Online Pinjaman ${trxOnline.anggota.noAnggota} - ${trxOnline.anggota.nama}`,
        entries,
      })
    }

    // 2. Notify Members & Admins
    const typeLabel =
      trxOnline.tipe === "TAGIHAN_WAJIB"
        ? "Simpanan Wajib"
        : trxOnline.tipe === "SIMPANAN_SUKARELA"
          ? "Simpanan Sukarela"
          : "Angsuran Pinjaman"

    await notifyMember(
      {
        anggotaId: trxOnline.anggotaId,
        title: "Pembayaran Online Sukses",
        message: `Pembayaran ${typeLabel} Rp${nominalNum.toLocaleString("id-ID")} via Midtrans berhasil.`,
        type: notifType,
        relatedId: notifType === "ANGSURAN" ? notifRelatedId : undefined,
      },
      tx,
    )

    await notifyAdmins(
      {
        title: "Pembayaran Online Sukses",
        message: `${trxOnline.anggota.nama} telah membayar ${typeLabel} Rp${nominalNum.toLocaleString("id-ID")} via Midtrans.`,
        type: notifType,
        relatedId: notifRelatedId,
      },
      tx,
    )

    // 3. Audit Log (use actual member, not random admin)
    const anggotaUser = await tx.user.findUnique({ where: { anggotaId: trxOnline.anggotaId } })
    await tx.auditLog.create({
      data: {
        userId: anggotaUser?.id ?? null,
        userEmail: anggotaUser?.email ?? null,
        action: "CREATE",
        entityType: "ONLINE_PAYMENT",
        entityId: trxOnline.id,
        newValue: {
          tipe: trxOnline.tipe,
          nominal: nominalNum,
          anggotaId: trxOnline.anggotaId,
          anggotaNama: trxOnline.anggota.nama,
          anggotaNo: trxOnline.anggota.noAnggota,
          paymentMethod,
        },
      },
    })
  })
}
