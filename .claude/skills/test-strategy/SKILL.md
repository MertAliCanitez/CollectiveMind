# Skill: test-strategy

## Purpose

Determine what to test, how to test it, and at what layer for every type of change in this platform. Produces tests that catch real bugs, run fast enough to not slow CI, and don't break when implementation details change.

## When to Use

Invoke this skill when:
- Adding tests to a new feature
- Deciding between unit, integration, and E2E tests
- Writing tests for billing, auth, or DB-dependent code
- Reviewing a test that seems to be testing the wrong thing
- Setting up the test infrastructure for a new package or app

## Test Philosophy

**Test behavior, not implementation.** Tests should survive refactoring. If a test breaks because you renamed a private function, it was testing the wrong thing.

**Integration tests over unit tests for DB code.** Mocking Prisma is fragile, slow to maintain, and gives false confidence. A real database query in a test environment catches actual bugs. This project uses a real test database.

**Unit tests for pure functions.** Business logic with no side effects (calculations, transformations, validations) is best tested with fast unit tests.

**E2E tests for critical user paths only.** E2E tests are slow and flaky. Reserve them for the 5–7 paths that, if broken, would prevent users from getting value (sign-up, org creation, product activation).

**The test pyramid:**
```
         /\
        /E2E\        5-7 critical flows
       /------\
      / Integr \     auth, billing, DB queries, webhook handlers
     /----------\
    /    Unit    \   utils, validators, business logic, UI components
   /──────────────\
```

## Test Stack

| Layer | Tool |
|-------|------|
| Unit + Integration | Vitest |
| Component tests | Vitest + `@testing-library/react` |
| E2E | Playwright |
| Test database | Real PostgreSQL (Docker), separate test DB |
| DB state | Prisma `$transaction` + rollback per test |

**Why Vitest over Jest?**
- Native TypeScript support — no transform config
- ESM-native — no interop headaches with Next.js packages
- Compatible with the same `expect` API as Jest — minimal migration cost
- 10–30x faster than Jest for typical monorepo setups

**Why not mock Prisma?**
Mocking Prisma means testing that your mock behaves correctly, not that your DB queries do. A real DB test that rolls back after each test is equally fast (< 5ms per test with local Postgres) and catches real query errors, index violations, and constraint failures.

## Test Database Setup

```ts
// packages/db/src/test-client.ts
import { PrismaClient } from "@prisma/client"

// Use a separate test database
export const testDb = new PrismaClient({
  datasources: {
    db: { url: process.env.TEST_DATABASE_URL },
  },
})
```

```ts
// vitest.setup.ts (per package that needs DB)
import { testDb } from "@repo/db/test-client"
import { beforeEach, afterAll } from "vitest"

// Wrap each test in a transaction that rolls back
beforeEach(async (ctx) => {
  // Vitest doesn't support transaction rollback out of the box
  // Use cleanup helpers instead
  await testDb.$executeRaw`BEGIN`
})

afterAll(async () => {
  await testDb.$disconnect()
})
```

Simpler approach — truncate relevant tables before each test suite:

```ts
// packages/db/src/test-helpers.ts
export async function cleanDatabase(db: PrismaClient) {
  // Order matters — FK constraints
  await db.$executeRaw`TRUNCATE "AuditLog", "InvoiceLineItem", "Invoice", "Subscription", "PlanFeature", "Plan", "OrgMember", "Organization", "User" CASCADE`
}
```

## What to Test at Each Layer

### 1. Unit Tests — `packages/utils`, `packages/types`

Test pure functions with no dependencies:

```ts
// packages/utils/src/__tests__/currency.test.ts
import { formatCurrency } from "../currency"
import { describe, it, expect } from "vitest"

describe("formatCurrency", () => {
  it("formats USD cents correctly", () => {
    expect(formatCurrency(9900, "USD")).toBe("$99.00")
  })

  it("formats EUR with locale", () => {
    expect(formatCurrency(9900, "EUR", "de-DE")).toBe("99,00 €")
  })

  it("handles zero", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00")
  })
})
```

```ts
// packages/types/src/__tests__/plan-feature.test.ts
import { PlanFeatureSchema } from "../billing"

describe("PlanFeatureSchema", () => {
  it("accepts valid feature", () => {
    expect(PlanFeatureSchema.safeParse({ key: "max_seats", value: "10" }).success).toBe(true)
  })

  it("rejects empty key", () => {
    expect(PlanFeatureSchema.safeParse({ key: "", value: "10" }).success).toBe(false)
  })
})
```

### 2. Integration Tests — `packages/billing`, `packages/auth`

Test domain functions against a real database:

```ts
// packages/billing/src/__tests__/entitlements.test.ts
import { describe, it, expect, beforeEach } from "vitest"
import { testDb } from "@repo/db/test-client"
import { cleanDatabase, seedTestOrg, seedProduct, seedPlan, seedSubscription } from "@repo/db/test-helpers"
import { checkEntitlement } from "../entitlements"

describe("checkEntitlement", () => {
  let orgId: string
  let productSlug: string

  beforeEach(async () => {
    await cleanDatabase(testDb)
    const org = await seedTestOrg(testDb)
    orgId = org.id
    const product = await seedProduct(testDb, { slug: "product-a" })
    productSlug = product.slug
  })

  it("returns hasAccess: false when no subscription exists", async () => {
    const result = await checkEntitlement({ orgId, productSlug })
    expect(result.hasAccess).toBe(false)
    expect(result.plan).toBeNull()
  })

  it("returns hasAccess: true for an active subscription", async () => {
    const plan = await seedPlan(testDb, { productSlug, billingInterval: "MONTH" })
    await seedSubscription(testDb, { orgId, planId: plan.id, status: "ACTIVE" })

    const result = await checkEntitlement({ orgId, productSlug })
    expect(result.hasAccess).toBe(true)
    expect(result.plan?.slug).toBe(plan.slug)
  })

  it("returns hasAccess: false for a canceled subscription", async () => {
    const plan = await seedPlan(testDb, { productSlug, billingInterval: "MONTH" })
    await seedSubscription(testDb, { orgId, planId: plan.id, status: "CANCELED" })

    const result = await checkEntitlement({ orgId, productSlug })
    expect(result.hasAccess).toBe(false)
  })

  it("returns correct feature value for the active plan", async () => {
    const plan = await seedPlan(testDb, {
      productSlug,
      features: [{ key: "max_seats", value: "10" }],
    })
    await seedSubscription(testDb, { orgId, planId: plan.id, status: "ACTIVE" })

    const result = await checkEntitlement({ orgId, productSlug })
    expect(result.featureValue("max_seats")).toBe("10")
  })
})
```

### 3. Integration Tests — Webhook Handlers

```ts
// apps/dashboard/app/api/webhooks/clerk/__tests__/sync.test.ts
describe("handleClerkWebhook", () => {
  it("creates a user on user.created event", async () => {
    await handleClerkWebhook({
      type: "user.created",
      data: {
        id: "clerk_user_123",
        email_addresses: [{ email_address: "test@example.com" }],
        first_name: "Test",
        last_name: "User",
        image_url: null,
      },
    })

    const user = await testDb.user.findUnique({ where: { clerkId: "clerk_user_123" } })
    expect(user).not.toBeNull()
    expect(user!.clerkId).toBe("clerk_user_123")
  })

  it("upserts (not duplicates) on repeated user.created", async () => {
    const event = { type: "user.created", data: { id: "clerk_123", ... } }
    await handleClerkWebhook(event)
    await handleClerkWebhook(event)

    const count = await testDb.user.count({ where: { clerkId: "clerk_123" } })
    expect(count).toBe(1)
  })
})
```

### 4. Component Tests

```tsx
// packages/ui/src/__tests__/subscription-status-badge.test.tsx
import { render, screen } from "@testing-library/react"
import { SubscriptionStatusBadge } from "../components/subscription-status-badge"

describe("SubscriptionStatusBadge", () => {
  it("renders 'Active' for ACTIVE status", () => {
    render(<SubscriptionStatusBadge status="ACTIVE" />)
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("renders 'Trial' for TRIALING status", () => {
    render(<SubscriptionStatusBadge status="TRIALING" />)
    expect(screen.getByText("Trial")).toBeInTheDocument()
  })
})
```

### 5. E2E Tests — Critical Paths Only

```ts
// apps/dashboard/e2e/onboarding.spec.ts
import { test, expect } from "@playwright/test"

test("new user can sign up and create an organization", async ({ page }) => {
  await page.goto("/sign-up")
  // ... fill Clerk embedded form
  await expect(page).toHaveURL("/onboarding")

  await page.fill('[name="name"]', "Test Company")
  await page.click('[type="submit"]')

  await expect(page).toHaveURL("/dashboard")
  await expect(page.getByText("Test Company")).toBeVisible()
})
```

**E2E tests to write (and no more):**
1. Sign up → create org → reach dashboard
2. Sign in → switch org → see correct products
3. Org admin → invite member → member accepts → member sees dashboard
4. Admin: create subscription → org sees active product
5. Billing settings: view active subscription details

## Test File Locations

```
packages/utils/src/__tests__/       ← unit tests
packages/billing/src/__tests__/     ← billing integration tests
packages/auth/src/__tests__/        ← auth sync integration tests
packages/ui/src/__tests__/          ← component tests
apps/dashboard/e2e/                 ← E2E tests
apps/admin/e2e/                     ← Admin E2E tests (minimal)
```

Test files are co-located with source where possible (`src/__tests__/`). E2E tests are in a top-level `e2e/` directory per app.

## Test Helpers and Factories

```ts
// packages/db/src/test-helpers.ts — shared across all packages
export async function seedTestOrg(db: PrismaClient, overrides = {}) {
  return db.organization.create({
    data: {
      clerkId: `test_org_${Date.now()}`,
      name: "Test Organization",
      slug: `test-org-${Date.now()}`,
      ...overrides,
    },
  })
}

export async function seedTestUser(db: PrismaClient, overrides = {}) {
  return db.user.create({
    data: {
      clerkId: `test_user_${Date.now()}`,
      email: `test-${Date.now()}@example.invalid`,
      ...overrides,
    },
  })
}
```

## CI Configuration

```yaml
# .github/workflows/ci.yml
- name: Test
  run: pnpm turbo test
  env:
    TEST_DATABASE_URL: postgresql://test:test@localhost:5432/collectivemind_test

- name: E2E
  run: pnpm --filter dashboard playwright test
  # Only runs on PRs targeting main, not on every feature branch PR
  if: github.base_ref == 'main'
```

E2E tests run only on the `develop → main` PR, not on every feature branch. This keeps feature branch CI fast.
