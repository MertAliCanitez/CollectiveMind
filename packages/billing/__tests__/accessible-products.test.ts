/**
 * Integration tests for getOrgAccessibleProducts().
 *
 * Tests cover the batch query that replaces the N+1 per-product entitlement
 * pattern in customer-facing product pages. Verifies that only products the
 * org genuinely has access to are returned, that subscription takes precedence
 * over grant for the same product, and that revoked/expired/canceled records
 * are excluded.
 *
 * Requires TEST_DATABASE_URL to be set.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { getOrgAccessibleProducts } from "../src/catalog.js"
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

// ─── Subscription path ────────────────────────────────────────────────────────

describe("getOrgAccessibleProducts — subscription path", () => {
  it("returns a product when org has an ACTIVE subscription", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct({ slug: "insights" })
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "ACTIVE" })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(1)
    expect(result[0]!.slug).toBe("insights")
    expect(result[0]!.accessSource).toBe("subscription")
    expect(result[0]!.activePlan).not.toBeNull()
    expect(result[0]!.activePlan!.id).toBe(plan.id)
  })

  it("returns a product when org has a TRIALING subscription", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct({ slug: "connect" })
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "TRIALING" })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(1)
    expect(result[0]!.accessSource).toBe("subscription")
  })

  it("does NOT return a product for a CANCELED subscription", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "CANCELED" })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(0)
  })

  it("does NOT return a product for a PAST_DUE subscription", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: org.id, planId: plan.id, status: "PAST_DUE" })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(0)
  })

  it("does NOT return products from another org's subscription", async () => {
    const orgA = await createTestOrg()
    const orgB = await createTestOrg()
    const product = await createTestProduct()
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: orgA.id, planId: plan.id })

    const result = await getOrgAccessibleProducts(orgB.id)

    expect(result).toHaveLength(0)
  })

  it("returns activePlan details (id, slug, name, billingInterval)", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: org.id, planId: plan.id })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result[0]!.activePlan).toMatchObject({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      billingInterval: plan.billingInterval,
    })
  })
})

// ─── AccessGrant path ─────────────────────────────────────────────────────────

describe("getOrgAccessibleProducts — grant path", () => {
  it("returns a product when org has a valid grant", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct({ slug: "insights" })
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(1)
    expect(result[0]!.slug).toBe("insights")
    expect(result[0]!.accessSource).toBe("grant")
    expect(result[0]!.activePlan).toBeNull()
  })

  it("does NOT return a product for a revoked grant", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      revokedAt: new Date(Date.now() - 1000),
    })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(0)
  })

  it("does NOT return a product for an expired grant", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      expiresAt: yesterday,
    })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(0)
  })

  it("returns a product for a grant that expires in the future", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      expiresAt: nextYear,
    })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(1)
    expect(result[0]!.accessSource).toBe("grant")
  })

  it("does NOT return products from another org's grant", async () => {
    const orgA = await createTestOrg()
    const orgB = await createTestOrg()
    const product = await createTestProduct()
    await createTestAccessGrant({ organizationId: orgA.id, productId: product.id })

    const result = await getOrgAccessibleProducts(orgB.id)

    expect(result).toHaveLength(0)
  })
})

// ─── Empty / no access ────────────────────────────────────────────────────────

describe("getOrgAccessibleProducts — no access", () => {
  it("returns an empty array when org has no subscriptions or grants", async () => {
    const org = await createTestOrg()

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(0)
  })
})

// ─── Multi-product ────────────────────────────────────────────────────────────

describe("getOrgAccessibleProducts — multiple products", () => {
  it("returns all products the org has access to across both paths", async () => {
    const org = await createTestOrg()

    const productA = await createTestProduct({ slug: "product-a" })
    const planA = await createTestPlan({ productId: productA.id })
    await createTestSubscription({ organizationId: org.id, planId: planA.id })

    const productB = await createTestProduct({ slug: "product-b" })
    await createTestAccessGrant({ organizationId: org.id, productId: productB.id })

    const result = await getOrgAccessibleProducts(org.id)
    const slugs = result.map((p) => p.slug).sort()

    expect(result).toHaveLength(2)
    expect(slugs).toEqual(["product-a", "product-b"])
  })

  it("deduplicates: subscription takes precedence when both subscription and grant exist", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct({ slug: "insights" })
    const plan = await createTestPlan({ productId: product.id })
    await createTestSubscription({ organizationId: org.id, planId: plan.id })
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result).toHaveLength(1)
    expect(result[0]!.accessSource).toBe("subscription")
    expect(result[0]!.activePlan).not.toBeNull()
  })

  it("returns products sorted by sortOrder", async () => {
    const org = await createTestOrg()

    // Create out of order — the factory uses default sortOrder=0, so we need to
    // set them directly via testDb
    const productZ = await testDb.product.create({
      data: { slug: "z-product", name: "Z Product", status: "ACTIVE", sortOrder: 99 },
    })
    const productA = await testDb.product.create({
      data: { slug: "a-product", name: "A Product", status: "ACTIVE", sortOrder: 1 },
    })

    const planZ = await createTestPlan({ productId: productZ.id })
    const planA = await createTestPlan({ productId: productA.id })

    await createTestSubscription({ organizationId: org.id, planId: planZ.id })
    await createTestSubscription({ organizationId: org.id, planId: planA.id })

    const result = await getOrgAccessibleProducts(org.id)

    expect(result[0]!.slug).toBe("a-product")
    expect(result[1]!.slug).toBe("z-product")
  })
})
