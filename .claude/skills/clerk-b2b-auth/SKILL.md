# Skill: clerk-b2b-auth

## Purpose

Implement authentication, authorization, and identity patterns correctly using **Clerk** for this B2B multi-tenant platform. Covers middleware setup, role-based access control, webhook sync, org context, and authorization in Server Components, Route Handlers, and Server Actions.

## When to Use

Invoke this skill when:
- Adding auth protection to a new route or page
- Implementing role-based access checks
- Writing or modifying Clerk webhook handlers
- Syncing Clerk data to the PostgreSQL database
- Implementing org switching or multi-org flows
- Debugging auth context issues (missing `orgId`, wrong role, etc.)
- Adding platform-level role checks (admin panel access)

## Architecture Summary

```
Clerk (external) ──webhooks──► packages/auth/sync.ts ──► packages/db (PostgreSQL)
       │
       JWT (httpOnly cookie)
       │
       ▼
middleware.ts (route protection, role gate)
       │
       ▼
Server Component / Route Handler
  └── auth() → { userId, orgId, orgRole, sessionClaims }
        │
        └── packages/auth/roles.ts → role check functions
              │
              └── packages/billing/entitlements.ts → product access checks
```

## Rules and Guardrails

**Identity context:**
- Always derive `orgId` from `auth()` — never from query params, URL segments, or request body.
- Always derive `userId` from `auth()` — never trust a `userId` passed by the client.
- If `auth()` returns `null` for `orgId`, the user has no active organization. Redirect to `/onboarding`.

**Authorization layers (all three must be applied):**
1. **Middleware** — blocks unauthenticated requests and enforces platform role for admin app
2. **Route/Component** — checks org membership and role for the specific operation
3. **Domain layer** — `organizationId` in every DB query (handled by domain functions, not routes)

**Never:**
- Skip any authorization layer for "just this one route"
- Use `clerkMiddleware()` with a blanket `publicRoutes: ["(.*)"]` in dashboard or admin apps
- Store session tokens, JWTs, or auth cookies manually
- Call `currentUser()` when `auth()` is sufficient — `auth()` is faster (no network call)
- Use `useUser()` or `useOrganization()` in Server Components — these are client-only hooks

## Step-by-Step Working Instructions

### Protecting a new route in `apps/dashboard`

```ts
// apps/dashboard/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return

  const { userId, orgId } = await auth.protect()

  // No active org → onboarding
  if (!orgId && !req.nextUrl.pathname.startsWith("/onboarding")) {
    return Response.redirect(new URL("/onboarding", req.url))
  }
})

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
}
```

### Protecting a new route in `apps/admin`

```ts
// apps/admin/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth.protect()

  const platformRole = sessionClaims?.platformRole
  if (platformRole !== "super_admin" && platformRole !== "support") {
    return new NextResponse(null, { status: 403 })
  }
})
```

### Checking auth context in a Server Component

```ts
// app/(protected)/settings/members/page.tsx
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { isOrgAdmin } from "@repo/auth"

export default async function MembersPage() {
  const { orgId, orgRole } = await auth()

  if (!orgId) redirect("/onboarding")
  if (!isOrgAdmin(orgRole)) redirect("/dashboard")  // or show 403 UI

  const members = await getOrgMembers(orgId)  // domain function, always takes orgId
  // ...
}
```

### Role check functions in `packages/auth`

```ts
// packages/auth/src/roles.ts

export function isOrgAdmin(orgRole: string | null | undefined): boolean {
  return orgRole === "org:admin"
}

export function isOrgBillingManager(orgRole: string | null | undefined): boolean {
  return orgRole === "org:admin" || orgRole === "org:billing_manager"
}

export function isPlatformAdmin(sessionClaims: Record<string, unknown> | null | undefined): boolean {
  return sessionClaims?.platformRole === "super_admin"
}

export function isPlatformStaff(sessionClaims: Record<string, unknown> | null | undefined): boolean {
  return sessionClaims?.platformRole === "super_admin" || sessionClaims?.platformRole === "support"
}
```

### Clerk webhook handler

```ts
// apps/dashboard/app/api/webhooks/clerk/route.ts
import { Webhook } from "svix"
import { headers } from "next/headers"
import { handleClerkWebhook } from "@repo/auth"

export async function POST(req: Request) {
  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let event
  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    })
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  await handleClerkWebhook(event)
  return new Response(null, { status: 200 })
}
```

### Sync handler in `packages/auth`

```ts
// packages/auth/src/sync.ts
import { db } from "@repo/db"

export async function handleClerkWebhook(event: WebhookEvent) {
  switch (event.type) {
    case "user.created":
    case "user.updated":
      await db.user.upsert({
        where: { clerkId: event.data.id },
        create: {
          clerkId: event.data.id,
          email: event.data.email_addresses[0].email_address,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          avatarUrl: event.data.image_url,
        },
        update: {
          email: event.data.email_addresses[0].email_address,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          avatarUrl: event.data.image_url,
        },
      })
      break

    case "user.deleted":
      await db.user.updateMany({
        where: { clerkId: event.data.id! },
        data: {
          deletedAt: new Date(),
          email: `deleted-${event.data.id}@deleted.invalid`,
          firstName: null,
          lastName: null,
          avatarUrl: null,
        },
      })
      break

    case "organization.created":
    case "organization.updated":
      await db.organization.upsert({
        where: { clerkId: event.data.id },
        create: {
          clerkId: event.data.id,
          name: event.data.name,
          slug: event.data.slug!,
          logoUrl: event.data.image_url,
        },
        update: {
          name: event.data.name,
          slug: event.data.slug!,
          logoUrl: event.data.image_url,
        },
      })
      break

    case "organizationMembership.created":
      const user = await db.user.findUnique({
        where: { clerkId: event.data.public_user_data.user_id },
      })
      const org = await db.organization.findUnique({
        where: { clerkId: event.data.organization.id },
      })
      if (user && org) {
        await db.orgMember.upsert({
          where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
          create: {
            organizationId: org.id,
            userId: user.id,
            role: event.data.role === "org:admin" ? "ADMIN" : "MEMBER",
          },
          update: {
            role: event.data.role === "org:admin" ? "ADMIN" : "MEMBER",
          },
        })
      }
      break
    // ... handle other events
  }
}
```

### Using auth in a Server Action

```ts
// app/(protected)/settings/members/actions.ts
"use server"
import { auth } from "@clerk/nextjs/server"
import { isOrgAdmin } from "@repo/auth"
import { InviteMemberSchema } from "@repo/types"

export async function inviteMember(formData: FormData) {
  const { orgId, orgRole } = await auth()

  if (!orgId) throw new Error("No active organization")
  if (!isOrgAdmin(orgRole)) throw new Error("Insufficient permissions")

  const parsed = InviteMemberSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  // Proceed with Clerk invitation + DB write
}
```

## Project-Specific Conventions

### Mapping Clerk roles to DB roles

| Clerk org role | DB `OrgRole` enum |
|----------------|-------------------|
| `org:admin` | `ADMIN` |
| `org:billing_manager` | `BILLING_MANAGER` |
| `org:member` | `MEMBER` |

Always use this mapping in sync handlers. The DB role is the source of truth for display; Clerk role is the source of truth for auth decisions.

### Custom session claims configuration

In the Clerk dashboard under **Sessions → Customize session token**, add:

```json
{
  "platformRole": "{{user.public_metadata.platformRole}}"
}
```

This makes `sessionClaims.platformRole` available in every auth context without a DB query.

### Platform role assignment

Platform roles are set server-side only, via the Clerk Backend SDK:

```ts
await clerkClient.users.updateUserMetadata(userId, {
  publicMetadata: { platformRole: "super_admin" }
})
```

This is done in the admin panel by a super_admin — never exposed as a user-accessible API.

### Org switching in the dashboard

Use Clerk's built-in `<OrganizationSwitcher />` in the dashboard nav. Configure it to:
- Hide personal accounts (B2B context — org is required)
- Redirect to `/onboarding` after creating a new org

```tsx
<OrganizationSwitcher
  hidePersonal
  afterCreateOrganizationUrl="/onboarding"
  afterSelectOrganizationUrl="/dashboard"
/>
```

## Common Gotchas

| Gotcha | Correct approach |
|--------|-----------------|
| `auth()` returns `orgId: null` in a protected route | User is authenticated but has no active org. Redirect to `/onboarding`. This is a valid state, not a bug. |
| Webhook fires before user exists in DB | The `organizationMembership.created` event may fire before `user.created` is processed. Always `findUnique` user by `clerkId` and handle `null` gracefully. |
| `currentUser()` is slow | Use `auth()` to get `userId` and fetch user from DB. `currentUser()` makes a network call to Clerk on every request. |
| Role check in a Client Component | Role is available via `useAuth().orgRole`. But authorization logic should never live in Client Components — it's UI decoration only. Real enforcement is on the server. |
| Missing org after sign-up | New users have no org. They need to create one in `/onboarding`. Middleware must redirect there, not to a 403. |
