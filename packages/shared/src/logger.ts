type LogLevel = "debug" | "info" | "warn" | "error"

type LogContext = {
  requestId?: string
  userId?: string
  orgId?: string
  action?: string
  resourceType?: string
  resourceId?: string
  durationMs?: number
  error?: string
  [key: string]: unknown
}

// Keys that should never appear in logs (PII guard)
const BLOCKED_KEYS = new Set([
  "email",
  "name",
  "firstName",
  "lastName",
  "phone",
  "address",
  "password",
  "token",
  "secret",
  "apiKey",
  "creditCard",
])

function sanitize(ctx: LogContext): LogContext {
  return Object.fromEntries(
    Object.entries(ctx).filter(([key]) => !BLOCKED_KEYS.has(key)),
  ) as LogContext
}

function write(level: LogLevel, message: string, ctx: LogContext = {}): void {
  const safe = sanitize(ctx)
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env["NEXT_PUBLIC_APP_NAME"] ?? process.env["APP_NAME"] ?? "collectivemind",
    ...safe,
  }

  if (process.env.NODE_ENV === "development") {
    const prefix = `[${level.toUpperCase()}]`
    const method = level === "error" ? console.error : console.warn
    method(prefix, message, Object.keys(safe).length > 0 ? safe : "")
  } else {
    process.stdout.write(JSON.stringify(entry) + "\n")
  }
}

export const logger = {
  debug: (message: string, ctx?: LogContext) => write("debug", message, ctx),
  info: (message: string, ctx?: LogContext) => write("info", message, ctx),
  warn: (message: string, ctx?: LogContext) => write("warn", message, ctx),
  error: (message: string, ctx?: LogContext) => write("error", message, ctx),
}
