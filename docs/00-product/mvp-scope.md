# MVP Scope

This file is the authoritative list of what is and is not in scope for the v1 production launch. Update it as scope decisions are made. When in doubt, reference this file before starting any new feature work.

## Scope Decision Rules

- If a feature is listed under **In Scope**, it must ship before v1 launch.
- If a feature is listed under **Out of Scope**, do not implement it — not even a stub — without a scope change recorded here.
- If a feature is ambiguous, add it to **Deferred / Needs Decision** and resolve before building.

---

## In Scope

### Foundation (Phase 0)
- [x] Turborepo + pnpm monorepo with all packages scaffolded
- [x] TypeScript strict mode across all packages
- [x] ESLint + Prettier configured and enforced in CI
- [x] Prisma schema with all 12 models
- [x] `prisma generate` in CI pipeline
- [x] GitHub Actions CI (lint, type-check, prisma-validate, test, build)
- [ ] Vercel projects created for `web` and `dashboard` (and `admin`)
- [ ] Environment variables set in Vercel and local `.env.local`

### Auth & Organizations (Phase 1)
- [ ] Clerk dev instance configured (Organizations enabled, custom roles added)
- [ ] Clerk webhook handler in `apps/dashboard` (user + org + membership events)
- [ ] DB sync: User, Organization, OrgMember upserted on every relevant webhook
- [ ] Middleware on `apps/dashboard`: require auth, require org context
- [ ] Middleware on `apps/admin`: require `support` or `super_admin` platform role
- [ ] Org onboarding flow (new org → first product selection)
- [ ] Member invite flow (Clerk-native, no custom UI needed at v1)
- [ ] Role-based rendering: ADMIN sees billing tab, MEMBER does not
- [ ] Admin panel: list orgs, view org members, view subscriptions

### Product Catalog & Billing Foundation (Phase 2)
- [ ] Products and Plans seeded in DB (`prisma/seed.ts`)
- [ ] `checkEntitlement({ orgId, productSlug })` enforced at product domain boundaries
- [ ] Subscription created manually by staff in admin panel
- [ ] `NullPaymentProvider` active in all environments (no live payment)
- [ ] Pricing page on `apps/web` (database-driven, reads Products + Plans)
- [ ] Billing portal stub: shows current plan, shows "contact us to upgrade" at v1
- [ ] AuditLog written for every subscription create/update

### Marketing Site (Phase 3)
- [ ] Homepage with value proposition and CTA
- [ ] Product pages (one per Product in DB)
- [ ] Pricing page
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] `apps/web` deployed to production Vercel

### Production Hardening (Phase 4)
- [ ] Staging environment (separate Clerk instance, separate DB)
- [ ] Structured logger (`packages/shared/src/logger.ts`) used in all server actions and API routes
- [ ] Sentry error monitoring wired in `apps/dashboard` and `apps/admin`
- [ ] Health check endpoint (`/api/health`) in dashboard and admin
- [ ] Rate limiting on auth-sensitive endpoints
- [ ] `next/headers` security headers configured
- [ ] Load test: dashboard handles 100 concurrent org sessions
- [ ] Runbook validated: team can deploy from scratch using `docs/04-runbooks/local-setup.md`

---

## Out of Scope for V1

These are explicit decisions — they will not be built until post-MVP prioritization:

| Feature | Why Deferred |
|---------|-------------|
| Live payment (Stripe) | NullPaymentProvider covers launch; payment complexity deferred |
| Transactional email | Clerk handles auth emails; no other triggers needed at v1 |
| Customer-facing developer API | No demand yet; scope risk high |
| SAML SSO | Clerk supports it; enable per-org when a customer needs it |
| Usage-based billing | No metering infrastructure; flat subscriptions sufficient |
| Internationalization | Single market at launch |
| Mobile apps | Web-only at v1 |
| `apps/dashboard` product features beyond access gate | Product-specific features are post-MVP per-product scope |

---

## Deferred / Needs Decision

> Move items here when raised, and resolve them before building.

_None currently open._

---

## How to Update This File

When scope changes:
1. Move items between sections with a short rationale note.
2. For significant scope additions, create an ADR in `docs/03-decisions/`.
3. Update `docs/02-backlog/backlog.md` to reflect the change.
4. Commit on a `docs/` branch with message: `docs: update mvp-scope — [what changed]`

**Last reviewed:** 2026-03-28
