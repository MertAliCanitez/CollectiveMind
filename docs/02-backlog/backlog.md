# Backlog

This is the ordered list of work items for CollectiveMind. Items at the top are highest priority. `next-task.md` always points to the single item currently being worked.

## Backlog Discipline

- **One item in flight at a time.** `next-task.md` holds the current task. Nothing else starts until it is complete or explicitly blocked.
- **Ordered, not grouped.** The list below is in priority order. Reorder when priorities change — don't just add to the bottom.
- **Granular enough to complete in one Claude session.** If an item would take more than ~2 hours of implementation, split it.
- **Linked to scope.** Every item here must map to something in `docs/00-product/mvp-scope.md`. If it doesn't, it's a new scope decision.

## Status Legend

| Symbol | Meaning                                   |
| ------ | ----------------------------------------- |
| `[ ]`  | Not started                               |
| `[~]`  | In progress (should match `next-task.md`) |
| `[x]`  | Done                                      |
| `[!]`  | Blocked — reason in item                  |
| `[-]`  | Dropped — reason in item                  |

---

## Done

- [x] **Architecture blueprint** — 7 docs under `docs/01-architecture/`
- [x] **Claude Code skill system** — 12 skills under `.claude/skills/`
- [x] **Monorepo scaffold** — Turborepo + pnpm, all apps and packages, CI workflow
- [x] **Scaffold stabilization** — Prisma hoisting, ESLint binary, ESM config fixes

---

## Phase 1 — Auth & Organizations

- [ ] **Clerk dev instance setup**
      Configure Clerk dashboard: enable Organizations, add custom `platformRole` session claim, create webhook endpoint pointing to local tunnel, add env vars to `.env.local`. No code — ops task.

- [ ] **Dashboard app: Clerk provider + middleware**
      Add `@clerk/nextjs` to `apps/dashboard`. Wire `ClerkProvider` in root layout. Create `middleware.ts` using `clerkMiddleware` from `@repo/auth`: require auth, require active org, redirect to org selection if no org context.

- [ ] **Clerk webhook handler**
      Implement `POST /api/webhooks/clerk` in `apps/dashboard`. Verify Svix signature. Call `handleClerkWebhook(event)` from `packages/auth/src/sync.ts`. Return 200/400 appropriately.

- [ ] **Auth package: sync handler implementation**
      Implement `handleClerkWebhook` in `packages/auth/src/sync.ts`: upsert User on `user.created`/`user.updated`, soft-delete on `user.deleted`, upsert Organization + OrgMember on membership events.

- [ ] **Org onboarding flow**
      After a new org is created in Clerk and synced to DB, redirect ADMIN to `/onboarding`. Onboarding page: select which Product to access (renders from DB), creates a pending subscription record via admin staff action or placeholder.

- [ ] **Dashboard layout with role-aware nav**
      Sidebar nav in `apps/dashboard`: shows product links for all active entitlements, shows Settings for ADMIN, shows Billing tab for ADMIN and BILLING_MANAGER only.

- [ ] **Admin panel: org list + org detail**
      `apps/admin`: page listing all Organizations (name, member count, plan, created date). Org detail page: members table, subscription history, audit log entries.

- [ ] **Admin panel: manual subscription create/update**
      Form in org detail page to assign or change a subscription: select Product, select Plan, set status (ACTIVE/TRIALING/CANCELED). Writes to DB + AuditLog. Uses NullPaymentProvider.

---

## Phase 2 — Product Catalog & Billing Foundation

- [ ] **Seed: products, plans, plan features**
      Run and verify `prisma/seed.ts` against a local DB. Ensure `product-a` and `product-b` exist with Free/Pro/Enterprise plans and PlanFeature records.

- [ ] **Entitlement gate on dashboard product routes**
      Wrap product section routes with `checkEntitlement({ orgId, productSlug })`. If `!hasAccess`, redirect to upgrade page or show locked state.

- [ ] **Pricing page on apps/web**
      Static-rendered page reading Products + Plans from DB at build time. Displays plan comparison table. CTA links to `/sign-up` on Clerk.

- [ ] **Billing portal stub in dashboard**
      `/settings/billing` page: shows current plan name, renewal date (if applicable), and "Contact us to change plan" CTA. No Stripe at v1.

---

## Phase 3 — Marketing Site

- [ ] **apps/web homepage**
      Hero, features section, social proof placeholder, pricing CTA. Responsive. Uses `packages/ui` components.

- [ ] **apps/web product pages**
      One page per Product (from DB or content layer). Describes features, links to pricing.

- [ ] **apps/web legal pages**
      `/privacy` and `/terms` — placeholder prose, easily replaced with legal copy.

---

## Phase 4 — Production Hardening

- [ ] **Sentry setup**
      Add Sentry to `apps/dashboard` and `apps/admin`. Wire `NEXT_PUBLIC_SENTRY_DSN`. Add `withSentryConfig` to next.config. Verify errors appear in Sentry on 500.

- [ ] **Structured logging audit**
      Verify every server action and API route calls `logger.info/error` with appropriate fields. No `console.log` in production paths.

- [ ] **Security headers**
      Configure `next.config` with `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` in both apps.

- [ ] **Staging environment**
      Separate Vercel env for staging. Separate Clerk instance. Separate DB (Neon branch or separate project). `.env.staging` values documented in `docs/04-runbooks/deploy.md`.

- [ ] **Health check endpoints**
      `GET /api/health` in dashboard and admin: checks DB connection, returns `{ ok: true, db: "connected" }`. Used by Vercel health checks.

- [ ] **Load test**
      k6 or similar: 100 concurrent sessions hitting dashboard. Baseline p99 < 500ms on product listing page. Document results.

---

## Post-MVP (not scheduled)

- [ ] Stripe integration — replace NullPaymentProvider with StripePaymentProvider
- [ ] Transactional email (Resend or similar) — welcome, subscription change, invoice
- [ ] Customer-facing developer API with API key auth
- [ ] SAML SSO via Clerk (per-org toggle)
- [ ] Usage-based billing metering
- [ ] i18n

---

## How to Update This Backlog

- **Starting work:** Move item to `[~]` and copy it to `next-task.md` with full detail.
- **Completing work:** Mark `[x]`, move to the Done section, clear `next-task.md`.
- **Adding items:** Insert in priority order, not at the bottom.
- **Scope changes:** Update `docs/00-product/mvp-scope.md` first, then add here.
- **After each Claude session:** Review the Done section and verify it matches reality.

**Last updated:** 2026-03-28
