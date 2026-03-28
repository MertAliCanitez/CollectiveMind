/**
 * Integration tests for the admin access grant data layer.
 *
 * AccessGrants are the manual override path for product access
 * (beta, comped, migration). These tests verify list/filter, create,
 * and revoke operations.
 *
 * Requires TEST_DATABASE_URL to be set.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { listGrants, createGrant, revokeGrant } from "../../../lib/admin/grants"
import {
  testDb,
  cleanDatabase,
  createTestOrg,
  createTestProduct,
  createTestAccessGrant,
  createTestUser,
} from "@repo/testing"

beforeEach(cleanDatabase)

afterAll(async () => {
  await testDb.$disconnect()
})

// ─── listGrants ───────────────────────────────────────────────────────────────

describe("listGrants", () => {
  it("returns all grants with org and product joins", async () => {
    const org = await createTestOrg({ name: "Acme", slug: "acme" })
    const product = await createTestProduct({ slug: "insights", name: "Insights" })
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const grants = await listGrants()

    expect(grants).toHaveLength(1)
    expect(grants[0]!.organizationName).toBe("Acme")
    expect(grants[0]!.productSlug).toBe("insights")
    expect(grants[0]!.organizationId).toBe(org.id)
  })

  it("returns an empty array when no grants exist", async () => {
    const grants = await listGrants()
    expect(grants).toEqual([])
  })

  it("filters by orgId", async () => {
    const org1 = await createTestOrg()
    const org2 = await createTestOrg()
    const product = await createTestProduct()
    await createTestAccessGrant({ organizationId: org1.id, productId: product.id })
    await createTestAccessGrant({ organizationId: org2.id, productId: product.id })

    const grants = await listGrants({ orgId: org1.id })
    expect(grants).toHaveLength(1)
    expect(grants[0]!.organizationId).toBe(org1.id)
  })

  it("returns only active grants when activeOnly=true", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    await createTestAccessGrant({ organizationId: org.id, productId: product.id }) // active
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      revokedAt: new Date(Date.now() - 1000),
    }) // revoked

    const activeGrants = await listGrants({ activeOnly: true })
    expect(activeGrants).toHaveLength(1)
    expect(activeGrants[0]!.revokedAt).toBeNull()
  })

  it("returns all grants (including revoked) when activeOnly is not set", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      revokedAt: new Date(),
    })

    const grants = await listGrants()
    expect(grants).toHaveLength(2)
  })

  it("includes grantedBy email when grantor exists", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const grantor = await createTestUser({ email: "staff@internal.com" })
    await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      grantedByUserId: grantor.id,
    })

    const grants = await listGrants()
    expect(grants[0]!.grantedBy).toBe("staff@internal.com")
  })

  it("returns grantedBy=null when no grantor", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const grants = await listGrants()
    expect(grants[0]!.grantedBy).toBeNull()
  })
})

// ─── createGrant ──────────────────────────────────────────────────────────────

describe("createGrant", () => {
  it("creates a grant with required fields", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()

    const grant = await createGrant({ organizationId: org.id, productId: product.id })

    expect(grant.organizationId).toBe(org.id)
    expect(grant.productId).toBe(product.id)
    expect(grant.revokedAt).toBeNull()
    expect(grant.expiresAt).toBeNull()
  })

  it("stores reason and expiresAt", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const expiry = new Date("2027-01-01")

    const grant = await createGrant({
      organizationId: org.id,
      productId: product.id,
      reason: "Beta partner",
      expiresAt: expiry,
    })

    expect(grant.reason).toBe("Beta partner")
    expect(grant.expiresAt!.toISOString()).toBe(expiry.toISOString())
  })

  it("links to a grantor user when grantedByUserId is provided", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const grantor = await createTestUser()

    const grant = await createGrant({
      organizationId: org.id,
      productId: product.id,
      grantedByUserId: grantor.id,
    })

    expect(grant.grantedByUserId).toBe(grantor.id)
  })

  it("creates a grant with null grantedByUserId (system-generated)", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()

    const grant = await createGrant({ organizationId: org.id, productId: product.id })

    expect(grant.grantedByUserId).toBeNull()
  })
})

// ─── revokeGrant ─────────────────────────────────────────────────────────────

describe("revokeGrant", () => {
  it("sets revokedAt to the current timestamp", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const grant = await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    const before = Date.now()
    const revoked = await revokeGrant(grant.id)
    const after = Date.now()

    expect(revoked.revokedAt).not.toBeNull()
    expect(revoked.revokedAt!.getTime()).toBeGreaterThanOrEqual(before)
    expect(revoked.revokedAt!.getTime()).toBeLessThanOrEqual(after)
  })

  it("does not delete the grant record", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const grant = await createTestAccessGrant({ organizationId: org.id, productId: product.id })

    await revokeGrant(grant.id)

    const inDb = await testDb.accessGrant.findUnique({ where: { id: grant.id } })
    expect(inDb).not.toBeNull()
    expect(inDb!.revokedAt).not.toBeNull()
  })

  it("preserves other fields after revocation", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const grant = await createTestAccessGrant({
      organizationId: org.id,
      productId: product.id,
      reason: "Should stay",
    })

    const revoked = await revokeGrant(grant.id)

    expect(revoked.reason).toBe("Should stay")
    expect(revoked.organizationId).toBe(org.id)
    expect(revoked.productId).toBe(product.id)
  })
})
