# Observability

**Last updated:** 2026-03-28
**Status:** Active — structured logging is live. Sentry integration is deferred until first real customer.

---

## What we have today

### Structured JSON logging

All server-side code logs through `packages/shared/src/logger.ts`. In production, every log line is a single JSON object written to stdout and captured by the container runtime (Vercel, Fly.io, etc.).

```typescript
import { logger } from "@repo/shared"

logger.info("subscription.created", { orgId, planId, status })
logger.warn("auth.access_denied", { userId, required: "org:admin" })
logger.error("clerk.webhook.processing_failed", { error: String(err), svixId })
```

**PII protection:** The logger strips `email`, `name`, `firstName`, `lastName`, `phone`, `address`, `password`, `token`, `secret`, `apiKey`, and `creditCard` keys from all log context. Never log raw user data.

**Development:** Logs are formatted as `[LEVEL] message { context }` to the console.
**Production:** Logs are JSON to stdout — one line per entry.

### Audit log (business record)

`AuditLog` in the database is the authoritative record of significant business actions. It is append-only — never update or delete rows. It is not a diagnostic tool; it is a business record.

**What is recorded today:**

| Source | Actions |
|---|---|
| `packages/billing` | `subscription.created`, `subscription.canceled`, `subscription.plan_changed` |
| Admin Server Actions | `product.created`, `product.updated` |
| Admin Server Actions | `plan.created`, `plan.updated` |
| Admin Server Actions | `price.created`, `price.updated` |
| Admin Server Actions | `grant.created`, `grant.revoked` |

**Schema:** See `prisma/schema.prisma → AuditLog`. Key fields: `actorType` (USER / ADMIN / SYSTEM), `organizationId`, `resourceType`, `resourceId`, `metadata` (JSON).

**View audit logs:** Admin panel → Audit Logs (`/admin/audit`).

### Auth failure logging

All auth boundary violations (unauthenticated access, insufficient role, platform admin access) log a `warn` event before redirecting. This creates a trace for debugging auth issues without exposing sensitive data.

**Logged events:**
- `auth.unauthenticated` — no session, redirecting to /sign-in
- `auth.no_active_org` — authenticated but no org selected
- `auth.org_not_in_db` — Clerk org not yet synced to DB (webhook race)
- `auth.access_denied` — insufficient org role
- `auth.platform_access_denied` — insufficient platform role

### Webhook signature logging

The Clerk webhook route logs `warn` for invalid signatures and `error` for processing failures. Both include the `svix-id` for cross-referencing with Clerk's webhook delivery dashboard.

### Error boundaries

`apps/dashboard/app/error.tsx` — catches unhandled errors in the dashboard React tree.
`apps/dashboard/app/global-error.tsx` — catches errors in the root layout itself.
`apps/web/app/error.tsx` — catches errors in the public site.

Both boundaries `console.error` the error today. When Sentry is added, replace the `console.error` with `Sentry.captureException(error)`.

---

## What is not yet wired up

### Sentry (deferred to first real customer)

Sentry integration is the next observability step. Add it when you have real traffic to monitor.

**Required packages:**
```bash
pnpm add @sentry/nextjs --filter=@repo/dashboard
pnpm add @sentry/nextjs --filter=@repo/web
```

**Required env vars** (see `.env.example`):
```
SENTRY_DSN=https://REPLACE_ME@o0.ingest.sentry.io/0
NEXT_PUBLIC_SENTRY_DSN=https://REPLACE_ME@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Where to wire it:**

1. `apps/dashboard/app/error.tsx` — replace `console.error` with `Sentry.captureException(error)`
2. `apps/dashboard/app/global-error.tsx` — same
3. `apps/web/app/error.tsx` — same
4. Add `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` per Sentry Next.js docs
5. Wrap `next.config.ts` with `withSentryConfig`

**What Sentry gives you over logging alone:**
- Stack traces with source maps
- Error grouping and deduplication
- Release tracking (which deploy introduced a regression)
- Performance traces (useful once webhooks + billing is live)

### Uptime monitoring

No uptime monitoring is configured. Before first customer, add:
- A synthetic check on `/api/health` (build one if it doesn't exist)
- A check on the Clerk webhook endpoint reachability

Recommended: Checkly, Better Uptime, or Vercel's built-in checks.

### Log aggregation

In Vercel/Fly.io deployments, stdout logs are available in the platform UI. For longer retention or search:
- **Vercel:** Log Drains → stream to Datadog, Logtail, or Axiom
- **Fly.io:** Log shipper to Papertrail or Loki

---

## Rate limiting

Webhook endpoints (`/api/webhooks/*`) are rate-limited by IP in `apps/dashboard/middleware.ts`:
- **Limit:** 30 requests per 60 seconds per IP
- **Implementation:** In-memory sliding window (per process instance)
- **Primary defense:** HMAC signature verification in the route handler — this is a secondary abuse guard

**Limitation:** The in-memory counter is per process. Under horizontal scaling, rate limiting will be per-instance, not per-IP across all instances. For stricter enforcement at scale, replace with `@upstash/ratelimit` backed by Redis.

---

## Incident response checklist

When something breaks in production:

1. **Check logs** in your hosting platform's log viewer for `"level":"error"` lines
2. **Check audit logs** in `/admin/audit` for unexpected mutations
3. **Check Clerk webhook delivery** at `dashboard.clerk.com → Webhooks → your endpoint` for failed deliveries
4. **Check the AuditLog table** directly if the admin UI is down:
   ```sql
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;
   ```
5. **Identify the `svix-id`** from Clerk webhook logs — matches `svixId` in our logs for correlation

---

## Anti-patterns to avoid

**Don't log PII.** The logger strips known PII keys, but don't fight it — don't add `{ userEmail }` to log context. Use IDs instead.

**Don't write diagnostic data to `AuditLog`.** AuditLog is a business record. Don't log debug info there. Use `logger.debug` for transient diagnostics.

**Don't delete or update `AuditLog` rows.** It is an append-only ledger. If you made an error, add a correcting entry with `action: "*.corrected"` and a `metadata.corrects` reference.

**Don't use `console.log` directly.** All structured logging goes through `@repo/shared/logger`. `console.log` produces unstructured output that can't be queried.
