# Clerk Auth Runbook

This document is the authoritative reference for all Clerk-related setup and configuration for CollectiveMind. It covers the full lifecycle: initial Clerk setup, environment variables, session claims, webhook configuration, and role assignments.

For the architectural decisions behind these choices, see `docs/01-architecture/auth.md`.

---

## Architecture Overview

```
Browser / App
   │
   ▼
Clerk (hosted identity)
   │  HMAC-signed webhooks
   ▼
apps/dashboard  POST /api/webhooks/clerk
   │
   ▼
packages/auth/src/sync.ts  → handleClerkWebhook()
   │
   ▼
PostgreSQL  users, organizations, org_members
```

Three layers of authorization:
1. **Middleware** (`apps/dashboard/middleware.ts`, `apps/admin/middleware.ts`) — blocks unauthenticated and unauthorized requests at the edge
2. **Route/Component** (`auth()` in server components) — verify context in each handler
3. **Domain query** (all `db.*` calls) — always filter by `organizationId` from the JWT

---

## Environment Variables

### Required — all apps

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |

### Required — `apps/dashboard` only

| Variable | Value / Where to get it |
|----------|------------------------|
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard → Webhooks → your endpoint → Signing Secret |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/onboarding` |

### Required — `apps/admin` only

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |

### One Clerk instance per environment

| Environment | Clerk instance |
|-------------|---------------|
| Local dev | dev instance (separate from staging/prod) |
| Staging | staging instance |
| Production | production instance |

Never share a Clerk instance between environments. Each has its own publishable key, secret key, and webhook endpoints.

---

## Clerk Dashboard Setup (One-Time Per Instance)

### 1. Create the application

1. Log in at clerk.com/dashboard
2. Create a new Application — name it `CollectiveMind Dev` (or Staging/Prod)
3. Enable **Email** and any OAuth providers you want (Google, GitHub)

### 2. Enable Organizations

1. Configure → Organizations
2. Toggle **Enable Organizations** on
3. Set **Max Memberships per Organization** (recommended: 500 for dev)
4. Under **Default Organization Role**, leave as `org:member`

### 3. Add custom organization roles

CollectiveMind uses two non-default Clerk roles:

1. Configure → Organizations → Roles
2. Add role: **Name:** `Billing Manager`, **Key:** `org:billing_manager`

The third role (`org:admin`) is Clerk's built-in admin role — do not create it.

Final org roles:
- `org:admin` — built-in
- `org:billing_manager` — custom
- `org:member` — built-in

### 4. Configure custom session claims

This injects `platformRole` from user metadata into every JWT.

1. Configure → Sessions → Edit
2. Scroll to **Customize session token**
3. Add the following JSON:
   ```json
   {
     "platformRole": "{{user.public_metadata.platformRole}}"
   }
   ```
4. Save

After this, every session token will include `platformRole` if the user's `publicMetadata.platformRole` is set. It will be absent (not null) if not set.

### 5. Create the webhook endpoint

1. Webhooks → Add Endpoint
2. **URL:** `https://<your-ngrok-url>/api/webhooks/clerk` (for dev)
3. **Subscribe to events:**
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
   - `organizationMembership.created`
   - `organizationMembership.updated`
   - `organizationMembership.deleted`
4. Save and copy the **Signing Secret** → add to `CLERK_WEBHOOK_SECRET` in `.env.local`

---

## Role Reference

### Platform Roles (stored in Clerk `publicMetadata.platformRole`)

These are set by a `super_admin` via the Clerk dashboard or a one-off script. They are not tied to any organization.

| Role | Access | How to assign |
|------|--------|--------------|
| `super_admin` | Full admin panel, can promote/demote other staff | Clerk dashboard → Users → [user] → Public metadata |
| `support` | Read-only admin panel | Same as above |
| *(absent)* | Regular user — no admin access | Default |

**Setting `super_admin` manually (bootstrap):**
1. Clerk dashboard → Users → find your user
2. Click **Public Metadata** → edit
3. Set: `{ "platformRole": "super_admin" }`
4. Save

### Organization Roles (managed by Clerk)

These are set when a user is invited to or joins an organization.

| Clerk role key | DB enum | Can do |
|----------------|---------|--------|
| `org:admin` | `ADMIN` | All org settings, billing, member management |
| `org:billing_manager` | `BILLING_MANAGER` | Billing and invoices only |
| `org:member` | `MEMBER` | Product access only |

Role checks are in `packages/auth/src/roles.ts`:
- `isOrgAdmin(orgRole)` — true for `org:admin`
- `isOrgBillingManager(orgRole)` — true for `org:admin` or `org:billing_manager`
- `isPlatformAdmin(sessionClaims)` — true for `super_admin`
- `isPlatformStaff(sessionClaims)` — true for `super_admin` or `support`

---

## Auth Patterns

### Protecting a server component or page

```typescript
// Method 1: use the dashboard's requireOrg() helper (returns DB org)
import { requireOrg } from "@/lib/auth"

export default async function MyPage() {
  const { org, orgRole } = await requireOrg()
  // org.id is the DB UUID — use this for all queries
  const items = await db.something.findMany({
    where: { organizationId: org.id }
  })
  return <div>{...}</div>
}
```

```typescript
// Method 2: call auth() directly (lower-level)
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function MyPage() {
  const { userId, orgId } = await auth()
  if (!userId) redirect("/sign-in")
  if (!orgId) redirect("/org-select")
  // ...
}
```

### Protecting a server action

```typescript
"use server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@repo/database"

export async function updateSomething(input: unknown) {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) throw new Error("Unauthorized")

  // Look up DB org — never trust a client-supplied orgId
  const org = await db.organization.findFirst({
    where: { clerkId: orgId, deletedAt: null }
  })
  if (!org) throw new Error("Organization not found")

  // Now use org.id for the query
  await db.something.update({
    where: { id: input.id, organizationId: org.id }, // org-scoped
    data: { ... }
  })
}
```

### Role check in a component

```typescript
import { auth } from "@clerk/nextjs/server"
import { isOrgAdmin } from "@repo/auth"

export default async function SettingsPage() {
  const { orgRole } = await auth()

  return (
    <div>
      {isOrgAdmin(orgRole) && <AdminSettings />}
    </div>
  )
}
```

### Checking platform role (admin panel)

```typescript
import { auth } from "@clerk/nextjs/server"
import { isPlatformStaff } from "@repo/auth"

export default async function AdminPage() {
  const { sessionClaims } = await auth()

  if (!isPlatformStaff(sessionClaims)) {
    return <div>Access denied</div>
  }

  return <div>Admin content</div>
}
```

---

## Auth Boundaries and Rules

### What the middleware does (and doesn't do)

The middleware is the **first** layer — it handles redirects and coarse-grained blocking.

| Scenario | Dashboard middleware | Admin middleware |
|----------|---------------------|-----------------|
| Not signed in | Redirect to `/sign-in` | Redirect to `/sign-in` |
| Signed in, no org | Redirect to `/org-select` | N/A (admin doesn't use orgs) |
| Signed in with org | Allow | Check platform role |
| Signed in, not platform staff | N/A | Return 403 JSON |

The middleware is **not** sufficient for security alone. Every server component and server action must also call `auth()` and verify context (defense in depth).

### The `orgId` rule

> `orgId` MUST come from `auth()`. It MUST NEVER come from request params, query strings, form data, or headers.

```typescript
// CORRECT
const { orgId } = await auth()

// WRONG — never do this
const { orgId } = params  // could be forged
const orgId = req.nextUrl.searchParams.get("orgId")  // could be forged
```

### The `organizationId` filter rule

Every database query that returns org-owned data MUST filter by `organizationId` from the JWT-derived org record:

```typescript
// CORRECT
await db.subscription.findMany({
  where: { organizationId: org.id }  // org.id from requireOrg()
})

// WRONG — no org filter allows cross-tenant data access
await db.subscription.findMany()
```

---

## Webhook Handler

The webhook handler at `apps/dashboard/app/api/webhooks/clerk/route.ts` is the only write path for User, Organization, and OrgMember records.

**What it does:**
- Verifies the svix HMAC signature (rejects invalid requests with 400)
- Calls `handleClerkWebhook(event)` from `packages/auth/src/sync.ts`
- Returns 500 on processing failure (Clerk retries on 5xx)

**What NOT to do:**
- Do not add authentication to this route — Clerk calls it without a session
- Do not parse the body as JSON before verification — svix needs the exact raw bytes
- Do not return 401 or 403 for invalid signatures — 400 is correct

**Testing webhooks locally:**

```bash
# Option 1: ngrok tunnel
ngrok http 3001
# Copy the https URL to your Clerk webhook endpoint config

# Option 2: Clerk CLI (if available)
npx @clerk/clerk-cli webhook listen --forward-to localhost:3001/api/webhooks/clerk
```

**Triggering a test event:**

In Clerk dashboard → Webhooks → your endpoint → Send Example → select event type → Send.

---

## Organization Switching

Clerk's built-in `<OrganizationSwitcher>` component handles org switching:

```typescript
import { OrganizationSwitcher } from "@clerk/nextjs"

// In a nav/header:
<OrganizationSwitcher
  hidePersonal
  afterSelectOrganizationUrl="/"
  afterCreateOrganizationUrl="/onboarding"
/>
```

When a user switches organizations, Clerk updates the active org in the session. The next request will have the new `orgId` in the JWT. No database changes are needed — only the session changes.

---

## Invitation Flow

Org admins can invite members via Clerk's built-in invitation system:

```typescript
import { OrganizationProfile } from "@clerk/nextjs"

// Shows the full org management UI including invitations:
<OrganizationProfile />
```

Or use Clerk's `inviteMembers` backend API in a server action:

```typescript
import { clerkClient } from "@clerk/nextjs/server"

const client = await clerkClient()
await client.organizations.createOrganizationInvitation({
  organizationId: clerkOrgId,
  emailAddress: "newmember@example.com",
  role: "org:member",
  inviterUserId: inviterClerkUserId,
})
```

When the invited user accepts and joins, Clerk sends `organizationMembership.created` → the webhook handler syncs the new `OrgMember` record to the database automatically.

---

## Troubleshooting

### "Missing Clerk environment variables"

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` or `CLERK_SECRET_KEY` is not set.

Check `.env.local` in the app directory. These are required for the app to start.

### Middleware redirects to `/sign-in` even when signed in

The session token may be expired or the cookie is missing. Clear cookies and sign in again.

Also check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in the browser-side env matches the instance you're signed into.

### Webhook returns 400 "Invalid signature"

`CLERK_WEBHOOK_SECRET` doesn't match the signing secret in Clerk dashboard, or the body was modified before verification (e.g. a reverse proxy altered it).

### Webhook returns 500 "Processing failed"

Check server logs. Common causes:
- Database is not running
- `DATABASE_URL` is not set
- A user or org referenced in a membership event hasn't synced yet (transient — Clerk retries)

### `platformRole` is undefined in sessionClaims

The custom session claim hasn't been configured in Clerk dashboard yet. See step 4 in the setup instructions above.

Or the user's `publicMetadata.platformRole` is not set. Set it manually for the first admin user (see the Role Reference section).

### org_role is showing wrong value after changing a member's role

Clerk membership updates send a `organizationMembership.updated` webhook. If the webhook handler hasn't processed it yet, the session may show the old role. Wait a few seconds and refresh.
