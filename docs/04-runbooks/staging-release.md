# Staging Release Checklist

**Last updated:** 2026-03-28
**Status:** Active

This document is the authoritative checklist for preparing and executing the first staging deployment of CollectiveMind, and for all subsequent staging releases.

---

## Readiness assessment

### What is ready for staging

| Area                           | Status   | Notes                                                               |
| ------------------------------ | -------- | ------------------------------------------------------------------- |
| Security headers               | ✅ Ready | HSTS, X-Frame-Options, CSP on all three apps                        |
| Auth middleware                | ✅ Ready | Clerk middleware enforces auth on all routes                        |
| Webhook signature verification | ✅ Ready | Svix HMAC on Clerk webhook route                                    |
| Database migrations            | ✅ Ready | Single committed init migration, two-phase pattern documented       |
| Structured logging             | ✅ Ready | JSON to stdout, PII-safe, deployed on all server-side code          |
| Audit trail                    | ✅ Ready | Admin mutations and billing events write to `AuditLog`              |
| Auth failure logging           | ✅ Ready | `warn` events on all denied/redirected auth checks                  |
| Error boundaries               | ✅ Ready | `error.tsx` + `global-error.tsx` in dashboard; `error.tsx` in web   |
| CI pipeline                    | ✅ Ready | Lint, format, type-check, prisma-validate, tests, build on every PR |
| Health check endpoints         | ✅ Ready | `/api/health` on dashboard and admin                                |
| Vercel project config          | ✅ Ready | `vercel.json` committed in all three app directories                |
| Rate limiting (webhooks)       | ✅ Ready | In-memory per-IP 30 req/60s on webhook routes                       |
| Branch protection docs         | ✅ Ready | `CONTRIBUTING.md` documents required rules to configure             |

### What is missing (must fix before staging)

| Item                              | Effort | Notes                                                                                        |
| --------------------------------- | ------ | -------------------------------------------------------------------------------------------- |
| Vercel projects created           | 1h     | Create `collectivemind-web`, `collectivemind-dashboard`, `collectivemind-admin` in Vercel UI |
| Clerk staging instance            | 30m    | Separate Clerk instance for staging. Configure webhook endpoint.                             |
| Neon staging database             | 30m    | Create staging branch in Neon, copy connection string                                        |
| GitHub secrets configured         | 15m    | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, etc. in Vercel UI                   |
| Clerk webhook endpoint registered | 15m    | Register `https://staging.collectivemind.com/api/webhooks/clerk` in Clerk staging            |
| Domain/URL configuration          | 30m    | Set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DASHBOARD_URL` to staging URLs                       |
| Branch protection configured      | 15m    | Apply rules from `CONTRIBUTING.md` to `main` on GitHub                                       |

### What can wait until after staging

| Item                               | Notes                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Sentry integration                 | Not needed for staging. Add before first paying customer. See `docs/04-runbooks/observability.md`. |
| Log aggregation (Datadog, Logtail) | Vercel function logs are sufficient for staging.                                                   |
| Uptime monitoring                  | Add Checkly or Better Uptime before production go-live.                                            |
| CI deployment automation           | Migrations are run manually for now. Automate when deploying frequently.                           |
| Admin app error boundaries         | Admin is internal only. Add `error.tsx` / `global-error.tsx` when prioritised.                     |
| Env var validation at startup      | `validateEnv()` exists in `packages/shared` but isn't called in apps. Wire before production.      |
| Payment provider (Stripe)          | `NullPaymentProvider` is correct for staging. Replace when billing is live.                        |

---

## Pre-staging setup (one-time)

### 1. Neon database

```bash
# In Neon console
# Create a "staging" branch from main (or create a new project)
# Copy the connection string — it looks like:
# postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/collectivemind?sslmode=require
```

Run migrations against the staging database:

```bash
DATABASE_URL="<staging-neon-url>" pnpm db:migrate:deploy
```

Verify:

```bash
DATABASE_URL="<staging-neon-url>" psql -c \
  "SELECT migration_name, finished_at FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

All rows should have a `finished_at` timestamp and no `rolled_back_at`.

### 2. Clerk staging instance

1. Log in to [clerk.com](https://clerk.com)
2. Create a new application (or use a "staging" instance if the plan supports it)
3. Copy `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
4. Configure webhook:
   - Go to Webhooks → Add endpoint
   - URL: `https://staging.collectivemind.com/api/webhooks/clerk`
   - Events: `user.*`, `organization.*`, `organizationMembership.*`
   - Copy the signing secret → `CLERK_WEBHOOK_SECRET`
5. Enable Organizations in Clerk settings

### 3. Vercel projects

Create three projects in Vercel (one per app). In each:

- **Root Directory:** `apps/dashboard` (or `apps/web`, `apps/admin`)
- **Framework:** Next.js (auto-detected via `vercel.json`)
- Build and install commands come from `vercel.json` — no manual entry needed

Connect each project to the GitHub repository. Vercel will:

- Build preview deployments for every PR
- Auto-deploy to production on merge to `main`

### 4. Environment variables per Vercel project

Set these in **Vercel → Project → Settings → Environment Variables**. Set them for **Production** and optionally **Preview** environments.

**All three apps:**

| Variable                            | Value                          |
| ----------------------------------- | ------------------------------ |
| `DATABASE_URL`                      | Neon staging connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk staging publishable key  |
| `CLERK_SECRET_KEY`                  | Clerk staging secret key       |

**`apps/dashboard` only:**

| Variable                    | Value                                          |
| --------------------------- | ---------------------------------------------- |
| `CLERK_WEBHOOK_SECRET`      | Clerk webhook signing secret                   |
| `NEXT_PUBLIC_APP_URL`       | `https://staging.collectivemind.com`           |
| `NEXT_PUBLIC_DASHBOARD_URL` | `https://staging-dashboard.collectivemind.com` |

**`apps/web` only:**

| Variable              | Value                                |
| --------------------- | ------------------------------------ |
| `NEXT_PUBLIC_APP_URL` | `https://staging.collectivemind.com` |

**`apps/admin` only:**

| Variable              | Value                                      |
| --------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_APP_URL` | `https://staging-admin.collectivemind.com` |

> Never commit real secrets to `.env.*` files or `vercel.json`. All secrets live in Vercel's encrypted env var store.

---

## Deployment procedure

### Standard staging deployment (after merge to main)

Vercel auto-deploys on merge. After CI passes and the PR is merged:

1. Watch the Vercel dashboard for the deployment to complete
2. Run the post-deploy health checks (see below)
3. Smoke test the critical paths (see below)

### Migration-required deployment

When the PR includes a Prisma schema change:

```
1. Ensure CI is green on the PR
2. Run the migration against staging DB BEFORE merging:
   DATABASE_URL=<staging-url> pnpm db:migrate:deploy
3. Verify migration success (see step 1 above)
4. Merge the PR
5. Vercel auto-deploys
6. Run health checks and smoke tests
```

If a migration fails partway, investigate before deploying app code. See `docs/04-runbooks/prisma-migrations.md` for recovery procedures.

---

## Post-deploy verification

### Health checks

```bash
# Dashboard
curl https://staging-dashboard.collectivemind.com/api/health
# Expected: {"ok":true,"db":"connected"}

# Admin
curl https://staging-admin.collectivemind.com/api/health
# Expected: {"ok":true,"db":"connected"}
```

A `503` response means the app is up but the database is unreachable — check the Neon console and the `DATABASE_URL` env var.

### Smoke tests (manual)

After each staging deployment, verify these paths:

**Public site (`apps/web`)**

- [ ] Homepage loads
- [ ] `/products` page loads
- [ ] No 500 errors in Vercel logs

**Dashboard (`apps/dashboard`)**

- [ ] `/sign-in` renders Clerk sign-in form
- [ ] Sign in with a test account
- [ ] Dashboard home loads and shows org context
- [ ] `/products` page loads (even if empty)
- [ ] `/billing` page loads (shows "billing not live" notice — expected)

**Admin (`apps/admin`)**

- [ ] `/admin/products` loads for a `super_admin` user
- [ ] `/admin/grants` loads
- [ ] Creating a product works (fills form, saves, visible in list)
- [ ] Audit log at `/admin/audit` shows the product.created entry

**Webhook**

- [ ] In Clerk dashboard, trigger a test event from Webhooks → your endpoint → Send example
- [ ] Check Vercel logs for `clerk.webhook.*` log lines
- [ ] Verify no errors

### Vercel log check

After deployment, open Vercel → your project → Functions tab and filter for `error` level entries. There should be none.

```bash
# Or via CLI:
vercel logs --output raw | grep '"level":"error"'
```

---

## Rollback procedure

### App rollback

In Vercel → Deployments → find the previous good deployment → "Promote to Production".

The health check will confirm the rollback was successful:

```bash
curl https://staging-dashboard.collectivemind.com/api/health
```

### Database rollback

Prisma does not support automatic down-migrations. If a staging migration must be reverted:

1. Write a new forward migration that reverses the schema change
2. Run it: `DATABASE_URL=<staging-url> pnpm db:migrate:deploy`
3. Roll back the app code in Vercel

If data integrity is at risk, create a Neon branch snapshot before the rollback migration.

See `docs/04-runbooks/prisma-migrations.md` for the full rollback guide.

---

## Staging vs production differences

| Aspect            | Staging                    | Production                                |
| ----------------- | -------------------------- | ----------------------------------------- |
| Clerk instance    | Staging (separate)         | Production (separate)                     |
| Database          | Neon staging branch        | Neon production branch                    |
| URL               | staging.collectivemind.com | collectivemind.com                        |
| Sentry DSN        | Optional (deferred)        | Required before launch                    |
| Log aggregation   | Vercel logs only           | Add drain before launch                   |
| Payment provider  | `NullPaymentProvider`      | `NullPaymentProvider` → Stripe when ready |
| Branch protection | Required                   | Required                                  |

**Never point staging at the production database.** They must always use separate Neon branches.

---

## Security checklist before any staging traffic

- [ ] No `.env` files committed to git (check with `git ls-files | grep '\.env'`)
- [ ] `.env.local` in `.gitignore` — verified
- [ ] All secrets set in Vercel env vars, not in `vercel.json`
- [ ] Clerk staging instance is isolated from production
- [ ] `CLERK_WEBHOOK_SECRET` is the staging signing secret, not production
- [ ] Vercel preview deployments do NOT share production `DATABASE_URL`
- [ ] Branch protection rules configured on `main` (see `CONTRIBUTING.md`)
- [ ] Admin app is accessible only to platform staff (tested above)

---

## Known limitations at staging (acceptable for now)

**In-memory rate limiting** — Webhook rate limiting (`apps/dashboard/middleware.ts`) is per-instance. Under horizontal scaling, each instance has its own counter. Acceptable at staging scale. Replace with `@upstash/ratelimit` (Redis) before high-traffic production launch.

**No Sentry** — Errors are logged to Vercel function logs. Monitor manually via `vercel logs`. Wire Sentry before first paying customer.

**No uptime monitoring** — Check manually post-deploy. Add Checkly or Better Uptime before production.

**Manual migration deploy** — Database migrations must be run manually before merging. Automate with a GitHub Actions deploy job when deploying frequently.

**Single migration** — The init migration includes the full schema. Subsequent migrations will be incremental and additive.
