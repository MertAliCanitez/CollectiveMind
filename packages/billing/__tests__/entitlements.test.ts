/**
 * Integration tests for checkEntitlement().
 *
 * This is the core access-control function — every product gate in the
 * platform calls it. Tests cover both the subscription path and the
 * AccessGrant (manual override) path.
 *
 * Requires TEST_DATABASE_URL to be set.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { checkEntitlement } from "../src/entitlements.js"
import {
  testDb,
  cleanDatabase,
  createTestOrg,
  createTestProduct,
  createTestPlan,
  createTestSubscription,
  createTestAccessGrant,
} from "@repo/testing"

beforeEach(cleanDatabase)

afterAll(async () => {
  await testDb.$disconnect()
})

async function setup() {
  const org = await createTestOrg()
  const product = await createTestProduct({ slug: "test-product" })
  const plan = await createTestPlan({
    productId: product.id,
    features: [
      { key: "max_seats", value: "10" },
      { key: "api_access", value: "true" },
    ],
  })
  return { org, product, plan }
}

// ─── Subscription path ────────────────────────────────────────────────────────

describe("checkEntitlement — subscription path", () => {
  it("returns hasAccess=true for an ACTIVE subscription", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "ACTIVE" })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe("subscription")
    expect(result.plan).not.toBeNull()
    expect(result.plan!.slug).toBe(plan.slug)
  })

  it("returns hasAccess=true for a TRIALING subscription", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "TRIALING" })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe("subscription")
  })

  it("returns hasAccess=false for a CANCELED subscription", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "CANCELED" })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe("none")
  })

  it("returns hasAccess=false for a PAST_DUE subscription", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "PAST_DUE" })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(false)
  })

  it("resolves feature values from plan features", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.featureValue("max_seats")).toBe("10")
    expect(result.featureValue("api_access")).toBe("true")
  })

  it("returns null for unknown feature keys", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.featureValue("does_not_exist")).toBeNull()
  })

  it("includes plan details (id, slug, name, billingInterval)", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.plan).toMatchObject({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      billingInterval: plan.billingInterval,
    })
  })
})

// ─── AccessGrant path ─────────────────────────────────────────────────────────

describe("checkEntitlement — access grant path", () => {
  it("returns hasAccess=true for a valid (non-revoked, non-expired) grant", async () => {
    const { org, product } = await setup()
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(true)
    expect(result.source).toBe("grant")
    expect(result.plan).toBeNull()
  })

  it("returns hasAccess=false for a revoked grant", async () => {
    const { org, product } = await setup()
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      revokedAt: new Date(Date.now() - 1000),
    })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe("none")
  })

  it("returns hasAccess=false for an expired grant", async () => {
    const { org, product } = await setup()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      expiresAt: yesterday,
    })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(false)
  })

  it("returns hasAccess=true for a grant that expires in the future", async () => {
    const { org, product } = await setup()
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      expiresAt: nextYear,
    })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(true)
  })

  it("featureValue always returns null for grant-based access", async () => {
    const { org, product } = await setup()
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.featureValue("max_seats")).toBeNull()
  })
})

// ─── No access ────────────────────────────────────────────────────────────────

describe("checkEntitlement — no access", () => {
  it("returns hasAccess=false when org has no subscription or grant", async () => {
    const { org, product } = await setup()

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(false)
    expect(result.source).toBe("none")
    expect(result.plan).toBeNull()
    expect(result.featureValue("anything")).toBeNull()
  })

  it("returns hasAccess=false for a different org's subscription", async () => {
    const { product, plan } = await setup()
    const otherOrg = await createTestOrg()
    await createTestSubscription({ organizationId: otherOrg.id, planId: plan.id })

    const myOrg = await createTestOrg()
    const result = await checkEntitlement({ orgId: myOrg.id, productSlug: product.slug })

    expect(result.hasAccess).toBe(false)
  })

  it("returns hasAccess=false for a different product's subscription", async () => {
    const org = await createTestOrg()
    const productA = await createTestProduct({ slug: "product-a" })
    const productB = await createTestProduct({ slug: "product-b" })
    const planA = await createTestPlan({ productId: productA.id })
    await createTestSubscription({ organizationId: org.id, planId: planA.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: productB.slug })

    expect(result.hasAccess).toBe(false)
  })
})

// ─── Subscription takes precedence over grant ─────────────────────────────────

describe("checkEntitlement — source priority", () => {
  it("returns source=subscription when both subscription and grant exist", async () => {
    const { org, product, plan } = await setup()
    await createTestSubscription({ organizationId: org.id, planId: plan.id })
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const result = await checkEntitlement({ orgId: org.id, productSlug: product.slug })

    expect(result.source).toBe("subscription")
    expect(result.plan).not.toBeNull()
  })
})
