import { ZodError } from "zod"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

function capture(err: unknown, context?: string) {
  try {
    const Sentry = require("@sentry/nextjs")
    if (Sentry?.captureException) {
      Sentry.captureException(err, { tags: { context } })
    }
  } catch {
    /* sentry not available */
  }
}

const isDev = process.env.NODE_ENV === "development"

export class AppError extends Error {
  public code: string
  public statusCode: number

  constructor(code: string, message: string, statusCode = 400) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.name = "AppError"
  }
}

export function sanitizeError(err: unknown, context?: string): Error {
  if (err instanceof AppError) {
    return err
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0]
    const message = firstIssue
      ? `${firstIssue.path.join(".")}: ${firstIssue.message}`
      : "Validasi gagal"
    if (isDev) {
      return new AppError("VALIDATION_ERROR", `${message} (${err.issues.length} errors)`)
    }
    return new AppError("VALIDATION_ERROR", "Data yang dimasukkan tidak valid")
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return new AppError("DUPLICATE", "Data sudah ada")
      case "P2025":
        return new AppError("NOT_FOUND", "Data tidak ditemukan")
      case "P2003":
        return new AppError("REFERENCE", "Data masih digunakan oleh data lain")
      default:
        logger.error("Unhandled Prisma error", { code: err.code, meta: err.meta, context })
        capture(err, context)
        return new AppError("DATABASE_ERROR", "Terjadi kesalahan database")
    }
  }

  if (err instanceof Error) {
    logger.error("Unhandled error", { message: err.message, context })
    capture(err, context)
    if (isDev) return err
    return new AppError("INTERNAL_ERROR", "Terjadi kesalahan internal")
  }

  logger.error("Unknown error type", { error: err, context })
  return new AppError("INTERNAL_ERROR", "Terjadi kesalahan internal")
}
