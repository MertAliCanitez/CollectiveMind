# Product Vision

## What CollectiveMind Is

CollectiveMind is a multi-product B2B SaaS platform. It sells software products to organizations, not to individual end users. Each customer is a company (an **Organization**). A company subscribes to one or more **Products** under a billing plan.

The platform ships as three applications:

| App              | Audience           | Purpose                                       |
| ---------------- | ------------------ | --------------------------------------------- |
| `apps/web`       | Public / prospects | Marketing site, pricing, product pages        |
| `apps/dashboard` | Org members        | Customer-facing product access, billing, team |
| `apps/admin`     | Internal staff     | Organization and subscription management      |

## Core Principles

**Organizations are the unit of business.** Every subscription, member, entitlement, and audit event belongs to an Organization — never to a raw user. This shapes every data query, every authorization check, and every billing event.

**Clerk owns identity.** Authentication, session management, org membership, and invitation flows are fully delegated to Clerk. The platform database stores a synced mirror (User, Organization, OrgMember) for relational joins but never manages passwords, sessions, or auth state directly.

**Billing is an abstraction.** At v1 the platform ships with `NullPaymentProvider` — subscriptions are managed manually by staff in the admin panel. When a real payment provider (Stripe) is wired in, only the provider adapter changes. Product domains call `checkEntitlement()` and never reference billing internals.

**Modular monolith first.** All products live in one codebase, one deployment, one database. Extraction to separate services is possible but not on the roadmap until clear performance or team-size triggers appear.

**Security by default.** Every database query is scoped by `organizationId` pulled from the JWT — never from user input. All authorization is three-layer: middleware, route/component, domain query.

## Who Uses It

### Platform Roles (global, via Clerk `publicMetadata.platformRole`)

| Canonical Name | Clerk Value | What They Can Do |
| -------------- | ----------- | ---------------- |
| `platform_super_admin` | `"super_admin"` | Full access to admin panel. Can manage orgs, subscriptions, access grants, plans, and staff roles. |
| `platform_support` | `"support"` | Read-only access to org and subscription state in the admin panel. Cannot modify. |

### Organization Roles (per-org, via Clerk built-in roles)

| Canonical Name | Clerk Value | What They Can Do |
| -------------- | ----------- | ---------------- |
| `customer_owner` | `"org:admin"` | Manage members, billing, subscriptions, and all org settings. |
| `customer_billing_manager` | `"org:billing_manager"` | Manage subscriptions and invoices only. No member or product management. |
| `customer_member` | `"org:member"` | Standard org member. No admin or billing capabilities. |

### Product Access Model (critical distinction)

**Role is not entitlement.** Organization roles control what a user can *manage*. They do not control which products a user can *access or see*.

- A `customer_owner` does **not** automatically get access to every product on the platform.
- A `customer_member` has the same product access as the `customer_owner` of their org — whatever the org is subscribed to or granted.
- Product access is determined entirely by the organization's active **Subscriptions** and **AccessGrants** in the database.

| Access path | When it applies |
| ----------- | --------------- |
| **Subscription** | Org has a paid, trialing, or free-tier subscription to a product plan. |
| **AccessGrant** | Staff has explicitly granted the org access to a product (trial, complimentary, migration). |

The customer portal only ever shows a user the products their organization has access to through one of these two paths.

## What Success Looks Like at MVP

At the end of Phase 4 (see `docs/01-architecture/roadmap.md`):

- An organization can sign up, be assigned a subscription by staff, and access their product.
- Staff can manage organizations and subscriptions through the admin panel.
- The marketing site presents products and pricing clearly.
- The codebase is production-hardened: structured logging, error monitoring, staging environment, CI green.
- Live payment processing is **not** in scope for MVP — it is the first post-MVP priority.

## Non-Goals at V1

- Payment collection (NullPaymentProvider ships to production)
- Email notifications (no transactional email at v1)
- Developer API / webhooks for customers
- SAML SSO
- Usage-based billing
- Internationalization

---

**Source of truth for product decisions:** this file.
**Source of truth for implementation scope:** `docs/00-product/mvp-scope.md`.
**Source of truth for architecture:** `docs/01-architecture/architecture.md`.
