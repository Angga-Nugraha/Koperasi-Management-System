const isDev = process.env.NODE_ENV === "development"

type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  action?: string
  userId?: string
  error?: unknown
  duration?: number
  [key: string]: unknown
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  if (isDev) {
    const fn = level === "error" ? console.error : level === "warn" ? console.warn : console.log
    fn(`[${level.toUpperCase()}] ${message}`, meta ? JSON.stringify(meta) : "")
  } else {
    if (level === "error") {
      console.error(JSON.stringify(entry))
    } else {
      console.log(JSON.stringify(entry))
    }
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
}
