import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

const useUpstash = !!(url && token)

let _ratelimit: Ratelimit | null = null

if (useUpstash) {
  _ratelimit = new Ratelimit({
    redis: new Redis({ url: url!, token: token! }),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "simko:login",
  })
}

const inMemory = new Map<string, { count: number; reset: number }>()

export async function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60000,
): Promise<{ success: boolean; remaining: number }> {
  if (_ratelimit) {
    const { success, remaining } = await _ratelimit.limit(key)
    return { success, remaining }
  }

  const now = Date.now()
  const entry = inMemory.get(key)

  if (!entry || now > entry.reset) {
    inMemory.set(key, { count: 1, reset: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count }
}

if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of inMemory) {
      if (now > entry.reset) inMemory.delete(key)
    }
  }, 60000)
}
