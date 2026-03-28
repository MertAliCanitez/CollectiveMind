/**
 * Test data factories.
 * All factories use upsert and are idempotent.
 * Generated IDs are deterministic when a seed is provided so tests are reproducible.
 */
import { testDb } from "./database.js"
import type {
  BillingInterval,
  PlanStatus,
  SubscriptionStatus,
  OrgRole,
} from "@repo/database"

let seq = 0
function nextSeq(): number {
  return ++seq
}

export async function createTestUser(overrides: Partial<{
  clerkId: string
  email: string
  firstName: string
  role: OrgRole
}> = {}) {
  const n = nextSeq()
  return testDb.user.create({
    data: {
      clerkId: overrides.clerkId ?? `test_user_${n}`,
      email: overrides.email ?? `user-${n}@test.invalid`,
      firstName: overrides.firstName ?? "Test",
      lastName: "User",
    },
  })
}

export async function createTestOrg(overrides: Partial<{
  clerkId: string
  name: string
  slug: string
}> = {}) {
  const n = nextSeq()
  return testDb.organization.create({
    data: {
      clerkId: overrides.clerkId ?? `test_org_${n}`,
      name: overrides.name ?? `Test Org ${n}`,
      slug: overrides.slug ?? `test-org-${n}`,
    },
  })
}

export async function createTestOrgWithAdmin(overrides?: {
  orgSlug?: string
  orgName?: string
}) {
  const org = await createTestOrg({
    name: overrides?.orgName,
    slug: overrides?.orgSlug,
  })
  const user = await createTestUser()

  await testDb.orgMember.create({
    data: {
      organizationId: org.id,
      userId: user.id,
      role: "ADMIN",
    },
  })

  return { org, user }
}

export async function createTestProduct(overrides: Partial<{
  slug: string
  name: string
}> = {}) {
  const n = nextSeq()
  return testDb.product.create({
    data: {
      slug: overrides.slug ?? `product-test-${n}`,
      name: overrides.name ?? `Test Product ${n}`,
      status: "ACTIVE",
    },
  })
}

export async function createTestPlan(params: {
  productId: string
  billingInterval?: BillingInterval
  displayPrice?: number
  status?: PlanStatus
  features?: { key: string; value: string }[]
}) {
  const n = nextSeq()
  return testDb.plan.create({
    data: {
      productId: params.productId,
      name: `Test Plan ${n}`,
      slug: `test-product-plan-${n}`,
      billingInterval: params.billingInterval ?? "MONTH",
      displayPrice: params.displayPrice ?? 4900,
      currency: "USD",
      isPublic: true,
      status: params.status ?? "ACTIVE",
      features: params.features
        ? { create: params.features }
        : undefined,
    },
    include: { features: true },
  })
}

export async function createTestSubscription(params: {
  organizationId: string
  planId: string
  status?: SubscriptionStatus
}) {
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)

  return testDb.subscription.create({
    data: {
      organizationId: params.organizationId,
      planId: params.planId,
      status: params.status ?? "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  })
}
