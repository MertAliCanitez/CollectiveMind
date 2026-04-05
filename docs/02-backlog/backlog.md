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
- [x] **Clerk dev instance setup** — Organizations enabled, `platformRole` session claim, webhook endpoint, env vars in `.env.local`
- [x] **Dashboard app: Clerk provider + middleware** — `ClerkProvider` in root layout, `middleware.ts` using `clerkMiddleware` from `@repo/auth`, redirects for unauthenticated and no-org states
- [x] **Clerk webhook handler** — `POST /api/webhooks/clerk` with Svix signature verification, calls `handleClerkWebhook` from `@repo/auth`
- [x] **Auth package: sync handler** — `handleClerkWebhook` in `packages/auth/src/sync.ts`: upserts User and Organization on Clerk events, soft-delete on `user.deleted`
- [x] **Org onboarding / org-select flow** — `/org-select` route with Clerk `<OrganizationList>`, middleware redirects no-org sessions there
- [x] **Dashboard layout with nav** — Sidebar nav (`DashboardNav`) with active-state highlighting, `OrganizationSwitcher`, `UserButton`, all dark-themed. Mobile header with drawer.
- [x] **Dark theme redesign** — All dashboard and admin routes use zinc dark theme. Clerk appearance configured at `ClerkProvider` level for portal modal coverage.
- [x] **Auth pages dark theme** — Sign-in, sign-up, org-select all use consistent dark Clerk appearance.
- [x] **Settings page** — `OrganizationProfile` + `UserProfile` embedded with dark appearance. Fixed clipping bug.
- [x] **Seed: products, plans, plan features** — `prisma/seed.ts` seeds `insights`, `connect`, `workspace` products with Free/Pro/Enterprise plans and PlanFeature records
- [x] **Product catalog and billing package** — `getProductCatalog()`, `checkEntitlement()`, `getCatalogProduct()`, `getOrgAccessibleProducts()` in `@repo/billing`. `NullPaymentProvider` active.
- [x] **Customer products page** — `/products` shows only org-accessible products via `getOrgAccessibleProducts()`. N+1 entitlement pattern replaced with 2-query batch.
- [x] **Customer home page** — `/home` shows only accessible products and org stats. Access-driven, not catalog-driven.
- [x] **Customer product detail route** — `/products/[slug]` with server-side entitlement gate. Unknown slug → `notFound()`. No access → `redirect("/products")`. Loading skeleton included.
- [x] **Billing portal stub** — `/billing` shows active subscriptions and grants. Amber notice when payment provider is not live.
- [x] **Internal operations panel** — `apps/dashboard/(admin)` with Organizations list+detail, Products/Plans CRUD, Access Grants (create/revoke), Audit Log. All routes gated by `requirePlatformStaff()` or `requirePlatformAdmin()`.
- [x] **v1 admin boundary decision** — Confirmed: internal ops panel lives in `apps/dashboard/(admin)`. `apps/admin` is a deferred placeholder. Documented in `CLAUDE.md` and architecture docs.
- [x] **Admin: create subscription for org** — Org detail page has create-subscription form (plan selector grouped by product, optional trialDays, optional notes) and cancel button on ACTIVE/TRIALING subscriptions. Duplicate guard prevents double-subscribing to the same product. All mutations go through `@repo/billing`.
- [x] **Admin: analytics dashboard** — `/admin/analytics` with stat cards (active orgs, active/trialing subscriptions, active grants, est. MRR, est. ARR) and per-product subscription breakdown table. MRR/ARR explicitly labeled as estimates with NullPaymentProvider disclaimer.
- [x] **Billing nav visibility** — Billing nav link hidden from `org:member` users who cannot access the billing page. Shown only to `org:admin` and `org:billing_manager` via `useAuth()` + `isOrgBillingManager()`.
- [x] **apps/web homepage** — Hero, TrustBar, FeatureHighlights, product grid from catalog, CtaBand. Dark theme, responsive.
- [x] **apps/web product pages** — `/products` (grid with coming-soon section) and `/products/[slug]` (product detail with plan cards and comparison table). Catalog-driven.
- [x] **apps/web legal pages** — `/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal` index. Placeholder prose, styled consistently.
- [x] **Billing page cleanup** — `/billing` N+1 entitlement pattern replaced with `getDashboardAccessibleProducts()` batch query. Three parallel queries instead of 2 + N sequential. No UI change.

---

## Upcoming — Phase 4: Production Hardening

- [ ] **Security headers** — `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` in `next.config.ts`. No external dependencies — can be done any time.
- [ ] **Sentry setup** — Add Sentry to `apps/dashboard`. Wire `NEXT_PUBLIC_SENTRY_DSN`. Verify errors appear in Sentry on 500. Requires Sentry project and DSN from you.
- [ ] **Staging environment** — Separate Vercel env, separate Clerk instance, separate DB (Neon branch or separate project). Requires deployment target decision from you.
- [ ] **Load test** — k6 or similar: 100 concurrent sessions on product listing page, p99 < 500ms baseline.

---

## Post-MVP (not scheduled)

- [ ] Live payment integration — replace `NullPaymentProvider` with a real provider (Stripe, Paddle, iyzico, or other — TBD on legal/business setup). Requires provider selection from you.
- [ ] Transactional email (Resend or similar) — welcome, subscription change, trial expiry
- [ ] Customer-facing developer API with API key auth
- [ ] SAML SSO via Clerk (per-org toggle, enterprise tier)
- [ ] Usage-based billing metering
- [ ] i18n
- [ ] Product workspace content — actual feature pages for Insights, Connect, Workspace products. Requires product spec from you.
- [ ] `apps/admin` as dedicated deployment — extract internal ops panel to `apps/admin` if deployment separation is needed

---

## How to Update This Backlog

- **Starting work:** Move item to `[~]` and copy it to `next-task.md` with full detail.
- **Completing work:** Mark `[x]`, move to the Done section, clear `next-task.md`.
- **Adding items:** Insert in priority order, not at the bottom.
- **Scope changes:** Update `docs/00-product/mvp-scope.md` first, then add here.
- **After each Claude session:** Review the Done section and verify it matches reality.

**Last updated:** 2026-04-05
