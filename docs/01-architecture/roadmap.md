# Implementation Roadmap

## Principles

- **Ship working software at the end of every phase.** Each phase produces a deployable, demonstrable system — not a collection of scaffolding.
- **Defer complexity honestly.** Items marked post-MVP are not forgotten — they are explicitly descoped with a reason. The architecture supports them.
- **No speculative engineering.** Features are built when they have a defined user or business need, not "just in case."
- **Foundation before features.** The first two phases are infrastructure. Product features don't start until the platform can safely handle auth, org management, and billing state.

---

## Phase 0 — Foundation (Weeks 1–2)

**Goal:** Working local dev environment. Everyone on the team can run the platform and push code.

### Deliverables

- [ ] Monorepo initialized: pnpm workspaces + Turborepo configured
- [ ] `packages/config`: shared ESLint, TypeScript, Tailwind configs
- [ ] `packages/db`: Prisma schema (full v1 schema), initial migration, seed script
- [ ] Docker Compose with PostgreSQL
- [ ] `apps/web`: Next.js app initialized, root layout, placeholder homepage
- [ ] `apps/dashboard`: Next.js app initialized, Clerk installed, middleware configured
- [ ] `apps/admin`: Next.js app initialized, Clerk + platform role gate in middleware
- [ ] `.env.example` with all required variables documented
- [ ] GitHub repository with branch protection on `main` and `develop`
- [ ] CI pipeline: lint + type-check + build on PR

**Why this order:** Without a functioning dev environment and CI, all subsequent work is unreliable. Phase 0 is the tax you pay once for everything else.

### Exit Criteria

- `pnpm dev` starts all three apps without errors
- `pnpm turbo build` succeeds in CI
- Prisma schema passes `prisma validate`
- A developer can sign in to `apps/dashboard` via Clerk

---

## Phase 1 — Auth & Organizations (Weeks 3–4)

**Goal:** Users can sign up, create an organization, invite members, and manage roles.

### Deliverables

- [ ] `packages/auth`: Clerk helper utilities, role check functions
- [ ] Clerk webhook handler in `apps/dashboard/api/webhooks/clerk`
  - `user.created/updated/deleted` → DB sync
  - `organization.created/updated/deleted` → DB sync
  - `organizationMembership.*` → DB sync
- [ ] Dashboard onboarding flow: `/onboarding` — org creation
- [ ] Dashboard: org member management (`/settings/members`)
  - Invite by email
  - Assign/change roles
  - Remove members
- [ ] Dashboard: org settings (`/settings/organization`) — name, slug, logo
- [ ] Dashboard: profile settings (`/settings/profile`)
- [ ] Admin: organizations list + detail view
- [ ] Admin: user list + detail view
- [ ] `AuditLog` writes for all org and member mutations

**Why this phase before billing:** You can't build per-org billing without a working org model. Auth is the load-bearing wall.

### Exit Criteria

- User can sign up, create an org, and invite a second user
- Second user can accept invite and access the dashboard
- Org admin can change a member's role
- Webhook sync is verified: Clerk event → DB record update within 2s
- Admin can view org and member state

---

## Phase 2 — Product Catalog & Billing Foundation (Weeks 5–6)

**Goal:** Products and plans exist in the database. Subscriptions can be created and managed (manually, no live payment).

### Deliverables

- [ ] `packages/billing`: full billing domain
  - `PaymentProvider` interface
  - `NullPaymentProvider` implementation
  - `getPaymentProvider()` factory
  - `checkEntitlement()` function
  - Subscription state machine
- [ ] DB seeded with 2–3 products and 2–3 plans each
- [ ] Dashboard: product listing (`/dashboard/products`)
- [ ] Dashboard: billing settings (`/settings/billing`)
  - Active subscriptions per product
  - Plan details
  - Upgrade prompt (non-functional checkout — links to contact form at v1)
- [ ] Admin: product management (create, edit, toggle status)
- [ ] Admin: plan management (create plans, edit features, toggle visibility)
- [ ] Admin: subscription management (create, update, cancel subscriptions for orgs)
- [ ] Marketing site: pricing page (reads plans from DB)
- [ ] Marketing site: product pages

**Why manual subscription management in admin:** This is the minimum viable billing. Early customers can be onboarded by the team without a live payment system. This generates revenue before the payment integration is built.

### Exit Criteria

- Admin can create a subscription for an org on any plan
- Dashboard shows the org's active subscriptions
- `checkEntitlement()` returns correct access for active/canceled subscriptions
- Pricing page displays plans from DB correctly
- Free plan subscription is created automatically on org creation

---

## Phase 3 — Marketing Site & Public Launch Prep (Week 7)

**Goal:** Public-facing platform is ready. Someone can discover, evaluate, and sign up.

### Deliverables

- [ ] Marketing site: homepage (hero, product overview, social proof)
- [ ] Marketing site: individual product landing pages
- [ ] Marketing site: about, contact, legal (privacy policy, terms of service)
- [ ] Marketing site: blog structure (can be empty initially)
- [ ] SEO: meta tags, OpenGraph, sitemap, robots.txt
- [ ] Marketing site: navigation and footer
- [ ] Dashboard: welcome state for new orgs (empty state design)
- [ ] Email: Clerk-native transactional emails configured (invite, welcome)

### Exit Criteria

- Lighthouse score ≥ 90 on marketing homepage
- Sign-up to active dashboard flow works end-to-end
- All legal pages present (required before acquiring customers)

---

## Phase 4 — Production Hardening (Week 8)

**Goal:** Platform is production-ready. Deployed to production. Observable and recoverable.

### Deliverables

- [ ] Staging environment: Vercel projects + staging DB + staging Clerk instance
- [ ] Production environment: Vercel projects + production DB + production Clerk instance
- [ ] GitHub Actions: staging deploy on `develop` merge
- [ ] GitHub Actions: production deploy with manual approval gate on `main` merge
- [ ] Structured logging in all server components and route handlers
- [ ] Error boundaries in all apps (graceful error pages)
- [ ] 500/404 custom error pages
- [ ] `prisma migrate deploy` integrated in production CI
- [ ] DB connection pooling configured (PgBouncer or Neon serverless)
- [ ] Vercel Analytics enabled
- [ ] Uptime monitoring (e.g., Better Uptime or Checkly — free tier)
- [ ] Security headers verified (all apps)
- [ ] `pnpm audit` passing in CI
- [ ] Admin panel: IP restriction or VPN access configured
- [ ] Runbook: how to promote to production, how to rollback

### Exit Criteria

- Production deployment succeeds via CI/CD
- Sign-up flow works on production with real Clerk keys
- All security headers present (verified via securityheaders.com)
- A subscription can be created in admin on production

---

## Post-MVP Roadmap

Prioritized order. Each item is a separate phase.

### Post-MVP 1 — Live Payment Integration (Stripe)

- [ ] `packages/billing/providers/stripe.provider.ts`
- [ ] Stripe webhook handler with signature verification
- [ ] Checkout session creation flow in dashboard
- [ ] Subscription lifecycle from Stripe webhooks → DB state sync
- [ ] Invoice sync from Stripe
- [ ] Customer portal (Stripe Billing Portal)
- [ ] Upgrade/downgrade flow with proration

**Why Stripe first:** Largest developer ecosystem, best documentation, easiest to implement correctly. Other providers follow the same adapter pattern.

### Post-MVP 2 — Email Notifications

- [ ] `packages/email`: React Email templates
- [ ] Welcome email on org creation
- [ ] Invoice email on payment
- [ ] Trial expiry warning (3 days, 1 day before)
- [ ] Subscription cancellation confirmation
- [ ] Member invitation email (supplement Clerk's default)

### Post-MVP 3 — Developer API

- [ ] API key model in DB (`ApiKey` table: org-scoped, hashed, with permissions)
- [ ] API key management in dashboard settings
- [ ] Public REST API with OpenAPI spec
- [ ] Rate limiting on API endpoints
- [ ] API usage logging

### Post-MVP 4 — SAML SSO

- [ ] Enable Clerk's SAML provider
- [ ] Enterprise plan feature gate for SSO
- [ ] Admin: SSO configuration UI per org
- [ ] Just-in-time provisioning for SAML users

### Post-MVP 5 — Advanced Analytics

- [ ] MRR / ARR dashboard in admin
- [ ] Churn tracking
- [ ] Cohort analysis
- [ ] Product usage analytics (per-product event tracking)
- [ ] Customer health score

### Post-MVP 6 — Usage-Based Billing

- [ ] Metered usage events (`UsageEvent` table)
- [ ] Usage aggregation job (daily/hourly)
- [ ] Metered billing integration with Stripe
- [ ] Usage dashboard for orgs

### Post-MVP 7 — Multi-Language / i18n

- [ ] `next-intl` integration across all apps
- [ ] Translation pipeline (Crowdin or Phrase)
- [ ] Currency and date localization
- [ ] RTL support for Arabic/Hebrew markets

---

## Architectural Upgrade Triggers

The modular monolith is the right choice until one of these conditions is true:

| Condition                                            | Response                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- |
| Different scaling requirements per domain            | Extract that domain to a standalone service              |
| Team size > 8 engineers                              | Consider domain team ownership with separate deployables |
| DB write throughput > 5k TPS sustained               | Introduce CQRS or read replicas per domain               |
| Billing domain requires 99.99% SLA separate from app | Extract to standalone billing service                    |
| Products need independent deploy cadence             | Extract product apps from dashboard monolith             |

Do not preemptively split. Split when the pain of the monolith exceeds the cost of distribution.
