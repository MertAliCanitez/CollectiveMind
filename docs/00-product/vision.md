# Product Vision

## What CollectiveMind Is

CollectiveMind is a multi-product B2B SaaS platform. It sells software products to organizations, not to individual end users. Each customer is a company (an **Organization**). A company subscribes to one or more **Products** under a billing plan.

The platform ships as three applications:

| App | Audience | Purpose |
|-----|----------|---------|
| `apps/web` | Public / prospects | Marketing site, pricing, product pages |
| `apps/dashboard` | Org members | Customer-facing product access, billing, team |
| `apps/admin` | Internal staff | Organization and subscription management |

## Core Principles

**Organizations are the unit of business.** Every subscription, member, entitlement, and audit event belongs to an Organization — never to a raw user. This shapes every data query, every authorization check, and every billing event.

**Clerk owns identity.** Authentication, session management, org membership, and invitation flows are fully delegated to Clerk. The platform database stores a synced mirror (User, Organization, OrgMember) for relational joins but never manages passwords, sessions, or auth state directly.

**Billing is an abstraction.** At v1 the platform ships with `NullPaymentProvider` — subscriptions are managed manually by staff in the admin panel. When a real payment provider (Stripe) is wired in, only the provider adapter changes. Product domains call `checkEntitlement()` and never reference billing internals.

**Modular monolith first.** All products live in one codebase, one deployment, one database. Extraction to separate services is possible but not on the roadmap until clear performance or team-size triggers appear.

**Security by default.** Every database query is scoped by `organizationId` pulled from the JWT — never from user input. All authorization is three-layer: middleware, route/component, domain query.

## Who Uses It

### Platform Roles (global, via Clerk `publicMetadata.platformRole`)

| Role | What They Can Do |
|------|-----------------|
| `super_admin` | Full platform access, can grant/revoke staff roles |
| `support` | Read-only access to org and subscription data in admin |

### Organization Roles (per-org, via Clerk built-in roles)

| Role | What They Can Do |
|------|-----------------|
| `ADMIN` | Manage members, billing, all org settings |
| `BILLING_MANAGER` | Manage subscriptions and invoices only |
| `MEMBER` | Access to org products, no admin capabilities |

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
