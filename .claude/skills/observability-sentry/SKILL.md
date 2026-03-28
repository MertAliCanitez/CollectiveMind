# Skill: observability-sentry

## Purpose

Instrument the platform with structured logging, error tracking, and contextual observability. Produces actionable signals — not noise — in production. Covers the logging utility pattern, Sentry integration for Next.js, error boundaries, and the audit vs. diagnostic log distinction.

## When to Use

Invoke this skill when:
- Adding structured logging to a new feature
- Integrating Sentry into an app for the first time
- Adding error boundaries to a page or route
- Debugging a production issue and needing to add more signal
- Reviewing code that logs PII or logs nothing useful
- Adding performance instrumentation to a slow query or route

## Core Principles

**Log for the operator, not for the developer.** Logs are read during incidents, not during development. Every log line should help someone diagnose a problem at 3am.

**Structured over freeform.** Log JSON objects, not concatenated strings. Structured logs can be queried; strings cannot.

**Context, not just messages.** A log line without `userId`, `orgId`, `action`, and `durationMs` is half a log line.

**Never log PII.** Email addresses, names, phone numbers, and payment data must never appear in logs or error reports. Log IDs only.

**Errors are for humans.** Sentry captures the exception and the context. The error message passed to `captureException` adds what Sentry can't infer automatically.

**Audit ≠ Diagnostic.** Business events (subscription canceled, member invited) belong in `AuditLog` (database). System events (slow query, auth failure) belong in application logs. Never conflate them.

## Stack

| Tool | Role |
|------|------|
| `@sentry/nextjs` | Error tracking, performance tracing, session replay (optional) |
| Structured `logger` utility | Consistent JSON log format across all server code |
| Vercel logs | Runtime log sink for v1 (ship to Axiom/Datadog post-MVP) |
| `AuditLog` table | Business-level action history (not a log sink) |

## The Logger Utility

A thin wrapper lives in `packages/utils/src/logger.ts`. All server-side code uses this — never `console.log` directly.

```ts
// packages/utils/src/logger.ts

type LogLevel = "debug" | "info" | "warn" | "error"

type LogContext = {
  requestId?: string
  userId?: string
  orgId?: string
  action?: string
  resourceType?: string
  resourceId?: string
  durationMs?: number
  error?: unknown
  [key: string]: unknown  // additional context
}

function log(level: LogLevel, message: string, context: LogContext = {}) {
  // Strip any accidentally included PII keys
  const safeContext = sanitizeContext(context)

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...safeContext,
    // In production, include service name for log routing
    service: process.env.NEXT_PUBLIC_APP_NAME ?? "unknown",
  }

  // In dev: pretty print; in production: JSON for log aggregator
  if (process.env.NODE_ENV === "development") {
    console[level === "debug" ? "debug" : level === "info" ? "log" : level](
      `[${level.toUpperCase()}] ${message}`,
      safeContext
    )
  } else {
    process.stdout.write(JSON.stringify(entry) + "\n")
  }
}

function sanitizeContext(ctx: LogContext): LogContext {
  const PII_KEYS = ["email", "name", "firstName", "lastName", "phone", "address", "ip"]
  return Object.fromEntries(
    Object.entries(ctx).filter(([key]) => !PII_KEYS.includes(key))
  )
}

export const logger = {
  debug: (msg: string, ctx?: LogContext) => log("debug", msg, ctx),
  info:  (msg: string, ctx?: LogContext) => log("info",  msg, ctx),
  warn:  (msg: string, ctx?: LogContext) => log("warn",  msg, ctx),
  error: (msg: string, ctx?: LogContext) => log("error", msg, ctx),
}
```

## Logging Patterns

### Route / Server Action logging

```ts
import { logger } from "@repo/utils"

export async function POST(req: Request) {
  const start = Date.now()
  const { orgId, userId } = await auth()

  try {
    const body = await req.json()
    // ... do work
    logger.info("subscription.created", {
      userId, orgId, planId: body.planId,
      durationMs: Date.now() - start,
    })
    return Response.json({ success: true })
  } catch (error) {
    logger.error("subscription.create.failed", {
      userId, orgId,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - start,
    })
    throw error  // let error boundary / Sentry handle it
  }
}
```

### Webhook handler logging

```ts
export async function POST(req: Request) {
  const eventType = event.type

  logger.info("webhook.received", { eventType, provider: "clerk" })

  try {
    await handleClerkWebhook(event)
    logger.info("webhook.processed", { eventType, durationMs: Date.now() - start })
  } catch (error) {
    logger.error("webhook.failed", {
      eventType,
      error: error instanceof Error ? error.message : String(error),
    })
    return new Response("Processing failed", { status: 500 })
  }
}
```

### DB query performance logging

For queries expected to take > 100ms:

```ts
const start = Date.now()
const results = await db.subscription.findMany({ where: { organizationId } })
const ms = Date.now() - start

if (ms > 200) {
  logger.warn("db.slow_query", {
    query: "subscription.findMany",
    orgId: organizationId,
    resultCount: results.length,
    durationMs: ms,
  })
}
```

## Sentry Integration

### Installation (per app)

```bash
pnpm --filter dashboard add @sentry/nextjs
pnpm dlx @sentry/wizard@latest -i nextjs --silent
```

### Configuration

```ts
// apps/dashboard/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Session replay only for production, sampled
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      // Never capture form inputs (could contain PII)
      maskAllInputs: true,
      blockAllMedia: false,
    }),
  ],
  beforeSend(event) {
    // Strip PII from breadcrumbs and request data
    if (event.request?.cookies) delete event.request.cookies
    return event
  },
})
```

```ts
// apps/dashboard/sentry.server.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### Adding user context to Sentry

Set Sentry user context in the root layout (server side) so all errors are attributed:

```ts
// In a Server Component where auth() is called
import * as Sentry from "@sentry/nextjs"

const { userId, orgId } = await auth()
if (userId) {
  Sentry.setUser({ id: userId })  // ID only — never email/name
}
if (orgId) {
  Sentry.setTag("orgId", orgId)
}
```

### Manual error capture with context

```ts
try {
  await providerAction()
} catch (error) {
  Sentry.withScope((scope) => {
    scope.setTag("orgId", orgId)
    scope.setTag("action", "payment.checkout")
    scope.setExtra("planId", planId)
    // Never add email, name, or payment details to extra
    Sentry.captureException(error)
  })
  throw error
}
```

## Error Boundaries

### App-level error boundary

```tsx
// apps/dashboard/app/(protected)/error.tsx
"use client"
import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"
import { Button } from "@repo/ui"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground max-w-md">
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <span className="block text-xs mt-1">Error ID: {error.digest}</span>
        )}
      </p>
      <Button onClick={reset} variant="outline">Try again</Button>
    </div>
  )
}
```

### Granular error boundary for a section

```tsx
// Wrap a non-critical section so it doesn't crash the whole page
<ErrorBoundary fallback={<SectionErrorFallback />}>
  <Suspense fallback={<Skeleton />}>
    <BillingOverview orgId={orgId} />
  </Suspense>
</ErrorBoundary>
```

## What to Log at Each Level

| Level | When to use |
|-------|-------------|
| `debug` | Detailed internal state during development. **Never reaches production logs.** |
| `info` | Business events: resource created, webhook processed, user authenticated |
| `warn` | Unexpected but recoverable: slow query, retry succeeded, deprecated feature used |
| `error` | Failures that affect users: unhandled exception, DB connection failure, auth error |

## What NOT to Log

- User email addresses, names, or any PII
- Full request bodies (may contain sensitive data)
- Passwords, tokens, API keys (obvious but stated explicitly)
- Successful health check probes (noise)
- Every DB query in production (use slow query threshold instead)
- Sentry breadcrumbs with form field values
