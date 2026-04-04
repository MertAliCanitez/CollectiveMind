# Authentication & Authorization Architecture

## Overview

Authentication is handled entirely by **Clerk**. Clerk is the single source of truth for:

- User identities
- Sessions and tokens
- Organization membership and roles
- OAuth / social login

The application database maintains a **synchronized copy** of user and organization data for relational integrity (foreign keys, joins) but never handles passwords, tokens, or session management.

---

## Clerk Instance Strategy

| Environment         | Clerk Instance                                |
| ------------------- | --------------------------------------------- |
| `local` + `preview` | Shared development instance                   |
| `staging`           | Dedicated staging instance                    |
| `production`        | Production instance (isolated, separate keys) |

**Why separate production instance:** A compromised development key cannot affect production users. Clerk's instances are isolated — user records, orgs, and sessions do not cross instances.

---

## Clerk Organizations as the B2B Primitive

Every B2B customer is represented as a **Clerk Organization**. This is the correct choice because:

1. Clerk Organizations are first-class primitives — they have memberships, roles, invitations, and metadata built in.
2. Building a custom organization model on top of Clerk user records would duplicate Clerk's work and introduce sync complexity.
3. Clerk's `organizationId` is available in every JWT and middleware context — no database roundtrip needed to determine which org a request belongs to.

### Organization Lifecycle

```
User signs up (individual)
  → Clerk creates User record
  → Webhook fires: user.created
  → App syncs user to DB

User creates/joins an Organization
  → Clerk creates/updates Organization
  → Webhook fires: organization.created / organizationMembership.created
  → App syncs org + membership to DB

User is invited to existing Organization
  → Clerk sends invitation email
  → Invitee accepts → becomes org member
  → Webhook fires: organizationMembership.created
  → App grants product access based on org subscription
```

---

## Role Architecture

### Platform Roles (via Clerk `publicMetadata`)

Platform roles are stored in the Clerk User `publicMetadata` object. This metadata is:

- Set server-side only (cannot be tampered with by the client)
- Available in the JWT session claims
- Checked in Next.js middleware and server components

```ts
// Clerk User publicMetadata shape
type UserPublicMetadata = {
  platformRole?: "super_admin" | "support"
}
```

**Why `publicMetadata` and not a custom Clerk role?**
Clerk's built-in role system is scoped to organizations. Platform roles span all organizations and are held by internal staff, not customers. Using `publicMetadata` keeps the distinction clean.

### Organization Roles (via Clerk built-in)

| Canonical Name | Clerk Value | Platform Meaning |
| -------------- | ----------- | ---------------- |
| `customer_owner` | `org:admin` | Can manage org settings, invite/remove members, and manage billing and subscriptions. |
| `customer_billing_manager` | `org:billing_manager` | Can manage subscriptions and billing only. No member management or product settings. |
| `customer_member` | `org:member` | Standard org member with no admin or billing capabilities. |

> **Important:** Organization roles govern account-management permissions only. They do **not** determine which products a user can see or use. Product access is granted via active `Subscription` or `AccessGrant` records — not by role. A `customer_owner` who has no subscriptions sees no products. A `customer_member` in an org with a subscription has the same product access as the `customer_owner` of that org.

A `org:billing_manager` custom role is registered in Clerk for the `customer_billing_manager` use case.

**Why not more custom roles at v1?**
Custom roles add complexity to every authorization check. Three roles cover the standard B2B split (owner, billing contact, member). Product-level permissions do not exist — they are derived from subscription/grant state, not roles.

---

## Clerk Webhook Sync Strategy

Clerk events are received via a webhook endpoint in the dashboard app. All sync writes go through the `packages/auth` domain layer.

### Webhook Endpoint

```
POST /api/webhooks/clerk
```

- Validates the `svix-signature` header using the Clerk webhook secret
- Routes events to domain handlers
- Returns `200` quickly; heavy work is done async (post-MVP: queue)

### Events Handled

| Event                            | Action                          |
| -------------------------------- | ------------------------------- |
| `user.created`                   | Upsert User in DB               |
| `user.updated`                   | Update User name/email in DB    |
| `user.deleted`                   | Soft-delete User in DB          |
| `organization.created`           | Upsert Organization in DB       |
| `organization.updated`           | Update Organization in DB       |
| `organization.deleted`           | Soft-delete Organization in DB  |
| `organizationMembership.created` | Create OrgMember record in DB   |
| `organizationMembership.updated` | Update OrgMember role in DB     |
| `organizationMembership.deleted` | Remove OrgMember record from DB |

### Why sync to DB at all?

Clerk is the authoritative source for identity, but the application needs to:

- Join subscriptions, audit logs, and product data against users and orgs
- Run analytics queries without Clerk API rate limits
- Maintain referential integrity (FK constraints in Postgres)

The DB copy is a projection of Clerk state, not an independent record. Conflicts resolve in favor of Clerk.

---

## JWT and Session Claims

Clerk JWT session tokens include organization context when a user has an active organization session:

```ts
// Available via auth() in Server Components and Route Handlers
const { userId, orgId, orgRole, orgSlug } = auth()
```

### Custom Session Claims

Additional claims are configured in the Clerk dashboard under "Sessions > Customize session token":

```json
{
  "platformRole": "{{user.public_metadata.platformRole}}",
  "orgRole": "{{org.role}}"
}
```

This makes platform role available in the JWT without a database lookup on every request.

---

## Middleware Architecture

`apps/dashboard` and `apps/admin` use Clerk middleware for route protection.

### Dashboard Middleware (`apps/dashboard/middleware.ts`)

```
Public routes:  /sign-in, /sign-up, /api/webhooks/*
Protected:      everything else

After auth check:
  - If no orgId → redirect to /onboarding
  - If accessing /admin/* → reject (wrong app)
```

### Admin Middleware (`apps/admin/middleware.ts`)

```
All routes protected.
After auth check:
  - Verify publicMetadata.platformRole === "super_admin" || "support"
  - If not → return 403 (do not redirect to sign-in — this is an internal tool)
```

**Why two separate apps for dashboard and admin?**

1. **Security isolation**: Admin routes cannot accidentally be exposed by a dashboard routing mistake.
2. **Deployment independence**: Admin can be deployed on a separate domain (e.g., `admin.collectivemind.com`) with IP allowlist at the CDN level.
3. **Bundle separation**: Admin imports heavy data-table libraries that should not inflate the customer dashboard bundle.

---

## Authorization Model

Authentication (who are you?) is handled by Clerk. Authorization (what can you do?) is handled by application code.

### Authorization Layers

**Layer 1 — Middleware (route-level)**
Blocks unauthenticated requests and enforces platform role for admin. Fast, runs at edge.

**Layer 2 — Server Component / Route Handler (action-level)**
Checks org membership and role before returning data or performing mutations. Example:

```ts
// In a Server Component or Route Handler
const { userId, orgId, orgRole } = auth()

if (!orgId) redirect("/onboarding")
if (orgRole !== "org:admin") throw new ForbiddenError()
```

**Layer 3 — Domain layer (data-level)**
Subscription and entitlement checks happen in the domain layer, not in the route. Example:

```ts
// packages/billing → checkEntitlement()
const entitlement = await checkEntitlement({ orgId, productSlug: "product-a" })
if (!entitlement.hasAccess) throw new EntitlementError()
```

**Why three layers?**

- Middleware alone is too coarse — it can't check subscription state.
- Route-level checks alone are fragile — one missed check = data leak.
- Domain-level checks alone are invisible to routing — the user gets a 500 instead of a clean redirect.
- Defense in depth: all three layers must be compromised simultaneously for a breach.

---

## Onboarding Flow

```
1. User signs up via Clerk (/sign-up)
2. Clerk creates user, fires user.created webhook
3. Dashboard middleware detects: authenticated but no active org
4. Redirect to /onboarding
5. User creates organization (Clerk Organization)
6. Clerk fires organization.created + organizationMembership.created
7. User selects product(s) to trial/activate
8. Billing domain creates pending subscription record
9. Redirect to /dashboard
```

If a user is invited to an existing org, steps 5–8 are skipped — they land in the inviting org's dashboard directly after accepting the invitation.

---

## Multi-Organization Support

A single user can be a member of multiple Clerk organizations. The dashboard must handle org switching:

- Clerk's `<OrganizationSwitcher />` component handles the UI
- Switching org changes the active `orgId` in the JWT
- The dashboard re-fetches data scoped to the new `orgId`
- All server-side queries are always filtered by `orgId` from `auth()` — never from client-supplied state

**Security implication**: An `orgId` must never be accepted from query parameters or request bodies as the authorization context. Always derive it from the JWT via `auth()`.

---

## Clerk Configuration Checklist

Before production launch, verify in the Clerk dashboard:

- [ ] Email verification required on sign-up
- [ ] MFA available (optional for users, enforceable by org admins post-MVP)
- [ ] Allowed OAuth providers configured
- [ ] Webhook signing secret rotated and stored in environment
- [ ] Session token lifetime set (recommend 24h for B2B)
- [ ] Custom session claims configured (`platformRole`)
- [ ] Organization creation restricted (users can create orgs; post-MVP: restrict for enterprise)
- [ ] Branding customized (logo, colors match platform)
- [ ] Redirect URLs allowlisted per environment
