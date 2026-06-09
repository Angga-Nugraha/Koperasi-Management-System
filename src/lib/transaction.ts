import { Prisma } from "@prisma/client"
import { prisma, PrismaTx } from "@/lib/prisma"
import { logger } from "@/lib/logger"

const MAX_RETRIES = 3
const BASE_DELAY = 100

export async function withRetry<T>(
  fn: (tx: PrismaTx) => Promise<T>,
  context?: string,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 30000,
      })
    } catch (err) {
      lastError = err

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2034" || err.code === "P2028")
      ) {
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 100
          logger.warn("Transaction conflict, retrying", {
            attempt,
            maxRetries: MAX_RETRIES,
            delay: Math.round(delay),
            context,
            code: err.code,
          })
          await new Promise((r) => setTimeout(r, delay))
          continue
        }
        logger.error("Transaction failed after retries", { attempt, context, code: err.code })
      }

      throw err
    }
  }

  throw lastError
}
