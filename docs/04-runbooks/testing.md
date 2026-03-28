# Testing Strategy

**Last updated:** 2026-03-28
**Status:** Active — tests exist for critical billing, auth, and admin paths.

---

## Philosophy

We do not chase coverage numbers. We test to protect refactors and to document critical contracts.

**Test something when:**

- It encodes a business rule (access control, billing state transitions)
- It touches the boundary between Clerk and our database (webhook sync)
- It is a query that future engineers will break by accident (catalog filtering, plan visibility)
- A bug here would be silent and costly to debug

**Do not test:**

- React rendering (unless a component has logic)
- Trivial getters and type wrappers
- External services directly (mock at the boundary)
- Things Next.js already tests (routing, middleware evaluation)

---

## Test tiers

### Unit — pure functions, no I/O

Fastest. Run on every save. No setup required.

**Target:** `packages/auth/src/roles.ts`

Role checks (`isOrgAdmin`, `isOrgBillingManager`, `isPlatformAdmin`, `isPlatformStaff`) are pure functions used in every auth boundary. They must be bulletproof.

**Run:**

```bash
pnpm vitest --filter packages/auth -- --reporter=verbose
```

---

### Integration — real database, no HTTP

Medium speed. Require `TEST_DATABASE_URL`. Isolated via `cleanDatabase()` in `beforeEach`.

**Targets:**

| Package            | File                         | What it covers                                            |
| ------------------ | ---------------------------- | --------------------------------------------------------- |
| `packages/auth`    | `sync.test.ts`               | Clerk webhook → DB user/org/membership sync               |
| `packages/billing` | `entitlements.test.ts`       | `checkEntitlement()` — subscription and AccessGrant paths |
| `packages/billing` | `subscriptions.test.ts`      | Subscription state machine (create, cancel, update)       |
| `packages/billing` | `catalog.test.ts`            | Product catalog query filtering and enrichment            |
| `apps/dashboard`   | `lib/admin/products.test.ts` | Admin product CRUD                                        |
| `apps/dashboard`   | `lib/admin/grants.test.ts`   | Access grant list/create/revoke                           |

**Database setup:**

```bash
# Create the test database (one-time)
createdb collectivemind_test

# Apply migrations
DATABASE_URL=postgresql://localhost/collectivemind_test pnpm prisma migrate deploy

# Set the test DB URL in .env.test or your shell
export TEST_DATABASE_URL=postgresql://localhost/collectivemind_test
```

**Run all integration tests:**

```bash
pnpm turbo test
```

**Run a single package:**

```bash
pnpm vitest run --project packages/billing
# or
cd packages/billing && pnpm test
```

---

### E2E — full browser, real stack

Slow. Not yet implemented. Reserved for critical happy paths post-MVP.

**Planned targets (Playwright):**

- Sign-in → org selection → dashboard home
- Admin creates product → publishes → visible in public catalog
- Access grant issued → customer sees product in dashboard

**When to add:** After the first real customer goes live. Before that, integration tests give sufficient confidence at lower cost.

---

## Test utilities

All shared helpers live in `packages/testing/src/`.

### `cleanDatabase()`

Truncates all tables in FK-safe order. Call in `beforeEach` for any test that writes to the DB.

```typescript
import { cleanDatabase } from "@repo/testing"

beforeEach(cleanDatabase)
```

> **Note:** `cleanDatabase` truncates `AccessGrant` and `Price` in addition to the core billing tables. If you add a new model, update the `TRUNCATE` statement in `packages/testing/src/helpers/database.ts`.

### Factories

All factories are additive (use `create`, not `upsert`) and use an auto-incrementing sequence for unique field defaults.

```typescript
import {
  createTestUser,
  createTestOrg,
  createTestOrgWithAdmin,
  createTestProduct,
  createTestPlan,
  createTestSubscription,
  createTestAccessGrant,
} from "@repo/testing"
```

**`createTestProduct`** — creates an ACTIVE product with a unique slug.

**`createTestPlan(params)`** — creates a plan under a product. Accepts `billingInterval`, `displayPrice`, `status`, and optional `features: { key, value }[]`.

**`createTestSubscription(params)`** — creates an ACTIVE subscription with `currentPeriodEnd` set to +1 month. Pass `status` to override.

**`createTestAccessGrant(params)`** — creates an access grant. Pass `expiresAt` or `revokedAt` to test expiry/revocation scenarios.

**`createTestOrgWithAdmin`** — convenience factory that creates an org + user + ADMIN membership in one call. Useful for auth tests.

### `testDb`

Direct Prisma client pointed at `TEST_DATABASE_URL`. Use for setup or assertion queries not covered by factories.

```typescript
import { testDb } from "@repo/testing"

// Setup: create a price record not covered by factories
await testDb.price.create({ data: { planId: plan.id, unitAmount: 4900, billingInterval: "MONTH" } })

// Assert: verify a side effect
const log = await testDb.auditLog.findFirst({ where: { action: "subscription.created" } })
expect(log).not.toBeNull()
```

---

## Vitest configuration

Each testable package has its own `vitest.config.ts`. The key settings:

```typescript
{
  globals: true,          // describe/it/expect available without import
  environment: "node",    // server-side code only
  pool: "forks",          // isolate each test file in a subprocess
  poolOptions: {
    forks: { singleFork: true },  // single fork — DB tests must not run in parallel
  },
  testTimeout: 30_000,    // DB round-trips can be slow in CI
}
```

**Why `singleFork: true`?**
Integration tests share a real PostgreSQL database. Running files in parallel would cause `cleanDatabase()` in one file to corrupt the state of another. Single-fork mode serializes file execution.

---

## What to test next

These are the highest-value tests not yet written:

### `packages/billing` — webhook processor

`processWebhookEvent()` in `webhooks.ts` handles provider webhook events. Add tests when the first payment provider is wired up. Until then, the NullPaymentProvider has no meaningful behavior to test.

### `packages/auth` — webhook signature verification

`verifyClerkWebhook()` uses Svix HMAC. Test with a known signing secret and crafted payload to verify the reject/accept boundary. This requires generating a real Svix signature in the test setup.

### `apps/dashboard` — Server Actions

The admin Server Actions (`createProductAction`, `createGrantAction`, etc.) are validated via Zod. Testing them requires calling the action function directly (they're regular async functions). Test these when the validation logic becomes more complex.

```typescript
// Example — not yet wired up
it("rejects invalid slug", async () => {
  const formData = new FormData()
  formData.set("slug", "INVALID SLUG!")
  formData.set("name", "Test")
  formData.set("status", "ACTIVE")

  // Actions redirect on error — catch the redirect
  await expect(createProductAction(formData)).rejects.toThrow("NEXT_REDIRECT")
})
```

### E2E — post-MVP

Use Playwright. Start with the sign-in → dashboard → product access flow. One happy-path test per critical user journey is enough.

---

## Running in CI

The `turbo.json` `test` task:

- Depends on `db:generate` (Prisma client must be generated)
- Passes `DATABASE_URL` and `TEST_DATABASE_URL` through to the subprocess
- Caches coverage output in `coverage/**`

```yaml
# GitHub Actions excerpt
- name: Run tests
  env:
    TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/collectivemind_test
  run: pnpm turbo test
```

The test database must be migrated before tests run:

```yaml
- name: Migrate test database
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/collectivemind_test
  run: pnpm prisma migrate deploy
```

---

## Anti-patterns to avoid

**Don't mock the database.** We've had bad experiences with mock/real divergence. Integration tests hit the real test DB. If a test is slow, optimize the query — don't mock it.

**Don't test Prisma internals.** If you're asserting that `findFirst` was called with a specific argument, you're testing the ORM, not your code.

**Don't assert on exact timestamps.** Use `toBeGreaterThan` / `toBeLessThan` with a window of ±1–2 seconds.

**Don't leave data between tests.** Always call `cleanDatabase()` in `beforeEach`, not `afterEach`. `afterEach` doesn't run if the test crashes, leaving dirty state.

**Don't use `afterEach` to clean.** Only use `afterAll` to disconnect the database client.
