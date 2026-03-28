# Security Architecture

## Threat Model

The primary threats for this platform are:

1. **Unauthorized access to another organization's data** (horizontal privilege escalation)
2. **Unauthorized access to a higher-privileged role's actions** (vertical privilege escalation)
3. **Account takeover** (credential theft, session hijacking)
4. **Injection attacks** (SQL, XSS, command injection)
5. **Secrets exposure** (credentials in code, logs, or error messages)
6. **Admin panel abuse** (unauthorized internal access)

Each section below addresses one or more of these threats.

---

## Authentication Security

Authentication is delegated to **Clerk**. Clerk handles:

- Password hashing (bcrypt, never visible to the application)
- Session token generation and rotation
- OAuth flow security
- Brute-force protection and rate limiting on auth endpoints
- Email verification

**Platform responsibility**: Never build custom auth logic. Never store passwords. Never generate session tokens.

### Session Token Handling

- JWT tokens are short-lived (24h) and stored in `httpOnly` cookies by Clerk
- The platform never reads or stores session tokens
- Token rotation is handled by Clerk automatically
- `auth()` in server components and route handlers always reads from the verified server-side session — never from client-supplied headers

---

## Authorization Security

### Defense in Depth: Three Layers

See `auth.md` for the layered authorization model. The security implication is:

**Layer 1 (Middleware)**: Blocks unauthenticated requests. Fast, runs at edge.
**Layer 2 (Route/Action)**: Verifies role and org membership for the specific operation.
**Layer 3 (Domain)**: Enforces data ownership — every DB query is scoped to `organizationId`.

An attacker would need to bypass all three layers simultaneously. In practice, the failure mode is a Layer 3 miss (missing `organizationId` filter on a query). This is mitigated by:

1. All domain functions require `organizationId` as a typed parameter (TypeScript enforces it)
2. Integration tests verify org isolation: org A cannot read org B's data
3. Code review checklist includes: "Does this query filter by organizationId?"

### IDOR (Insecure Direct Object Reference) Prevention

All resource IDs in URLs are UUIDs. This prevents enumeration (an attacker cannot guess `org/2`, `org/3`).

More importantly: the platform never trusts a resource ID in a URL to imply ownership. Example:

```ts
// WRONG — trusts the URL parameter alone
const subscription = await db.subscription.findUnique({ where: { id: params.id } })

// CORRECT — verifies ownership via orgId from JWT
const subscription = await db.subscription.findFirst({
  where: { id: params.id, organizationId: orgId }, // orgId from auth()
})
```

If the record is not found (because it belongs to a different org), a 404 is returned — not a 403. This prevents confirming the existence of records in other orgs.

### Admin Panel Access

The admin panel (`apps/admin`) is protected by:

1. Clerk authentication (must be signed in)
2. `publicMetadata.platformRole` check (must be `super_admin` or `support`)
3. (Post-MVP) IP allowlist at the CDN/Vercel level — only accessible from the company VPN

Platform role checks happen in middleware and are re-verified in every server component and route handler in the admin app.

---

## Tenant Isolation

Every table that contains customer data has an `organizationId` column that is indexed.

**Query policy:**

- Server components: derive `orgId` from `auth()`, pass to domain functions
- Domain functions: include `organizationId` in every `where` clause
- No cross-org queries are permitted outside of the admin domain (which has explicit `super_admin` gate)

**What this prevents:**
An authenticated user from Org A cannot access Org B's subscriptions, members, invoices, or product data — even if they guess a valid UUID — because the query always filters by their own `orgId` from the JWT.

---

## Input Validation

All user-supplied input is validated at the system boundary using **Zod**.

```ts
// In a Route Handler
const body = await request.json()
const parsed = CreateOrgSchema.safeParse(body)
if (!parsed.success) return Response.json({ errors: parsed.error.flatten() }, { status: 400 })
```

Zod schemas live in `packages/types` and are shared between:

- Route Handlers (server-side validation)
- React Hook Form (client-side validation)

This ensures the same rules apply on both sides without duplication.

**What this prevents:**

- SQL injection: Prisma uses parameterized queries — raw string interpolation is never used. Zod provides an additional layer by rejecting malformed input before it reaches Prisma.
- XSS: React escapes output by default. `dangerouslySetInnerHTML` is never used. User-supplied content is never rendered unescaped.

### No Raw SQL

Prisma's query builder is used for all database operations. `$queryRaw` is only acceptable for:

- Queries not expressible in Prisma (complex CTEs, window functions)
- Must use tagged template literals: `prisma.$queryRaw`\`SELECT ... WHERE id = ${id}\`` (parameterized — Prisma sanitizes the inputs)

`$executeRawUnsafe` is **banned** by ESLint rule.

---

## Secrets Management

### Principles

1. No secrets in the repository — ever. `.env.local` is gitignored. `.env.example` contains only variable names with placeholder values.
2. Secrets are injected at runtime by the deployment platform (Vercel environment variables).
3. Secrets are never logged. Logger utility strips known secret key names from log output.
4. `NEXT_PUBLIC_*` variables are exposed to the client bundle. Only publishable keys (e.g., Clerk publishable key) use this prefix.

### Secret Rotation

- Clerk secret keys: rotatable in Clerk dashboard with zero downtime (old key works briefly during rotation)
- Database passwords: rotatable with connection pool drain
- Webhook secrets: rotatable by updating both the provider and Vercel env var simultaneously

### Environment Variable Audit

A CI job checks that no `NEXT_PUBLIC_*` variable contains the string `SECRET`, `PRIVATE`, or `KEY` (common accidental exposure patterns).

---

## HTTP Security Headers

All Next.js apps configure the following security headers via `next.config.ts`:

```ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://clerk.collectivemind.com", // Clerk requires unsafe-inline for its components
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://clerk.collectivemind.com",
      "frame-src https://clerk.collectivemind.com",
    ].join("; "),
  },
]
```

**Note on CSP**: Clerk's hosted components require `unsafe-inline` for scripts. This is a known limitation. Clerk's component code is loaded from a trusted Clerk CDN, mitigating the risk.

---

## CSRF Protection

Next.js App Router's Route Handlers are same-origin by default. All state-mutating routes:

1. Require authentication (Clerk JWT — not vulnerable to CSRF because the token is in an httpOnly cookie that is not readable by scripts, and Clerk validates the origin)
2. Accept `application/json` content type (browsers never send `application/json` cross-origin without a CORS preflight)
3. Verify `origin` header matches the app domain for webhook-like endpoints

---

## Rate Limiting

At v1, rate limiting is handled at the CDN/Vercel Edge level via Vercel's built-in rate limiting. Post-MVP, implement application-level rate limiting with Upstash Redis on:

- `/api/webhooks/*` — high-frequency provider callbacks
- Auth endpoints — Clerk already rate-limits, but app-level secondary protection
- Any public API endpoints

---

## Webhook Security

Clerk webhooks and payment provider webhooks are verified using HMAC signature validation before any processing occurs.

```ts
// Clerk webhook verification
import { Webhook } from "svix"
const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET)
const event = wh.verify(rawBody, {
  "svix-id": headers.get("svix-id"),
  "svix-timestamp": headers.get("svix-timestamp"),
  "svix-signature": headers.get("svix-signature"),
})
```

If verification fails, the endpoint returns `400` immediately without processing the payload.

**Why this matters**: Without signature verification, an attacker could POST fake subscription activation events to trigger unauthorized access.

---

## Dependency Security

- `pnpm audit` runs in CI on every PR
- Dependabot (or Renovate) is configured to open PRs for security patches automatically
- No `--ignore-scripts` exceptions without documented justification
- All direct dependencies are pinned to exact versions in `package.json`; `pnpm-lock.yaml` is committed

---

## Data Privacy

- User PII (name, email) is not logged
- `AuditLog.metadata` must not contain PII — only IDs and action context
- Database backups are encrypted at rest (managed DB provider handles this)
- GDPR deletion: when `user.deleted` Clerk webhook fires, the User record is soft-deleted and PII fields are nulled (`email`, `firstName`, `lastName`, `avatarUrl`). The record shell is retained for FK integrity.

---

## Security Checklist for New Features

Before merging any feature that handles user data:

- [ ] Does every DB query that returns customer data include `organizationId` in the `where` clause?
- [ ] Is user input validated with Zod before it reaches the database?
- [ ] Is the route protected by both middleware and server-side `auth()` check?
- [ ] Are any new environment variables `NEXT_PUBLIC_` only if they are genuinely safe for clients?
- [ ] Does the feature avoid logging PII?
- [ ] Does the feature avoid `$executeRawUnsafe`?
- [ ] Are any new webhook endpoints verifying provider signatures?
