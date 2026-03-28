/**
 * Integration tests for the product catalog query layer.
 *
 * Tests cover status filtering, public/private plan visibility,
 * sort ordering, and null returns for unknown/inactive products.
 *
 * Content enrichment from product-content.ts is intentionally NOT tested here
 * (it would couple tests to marketing copy). We verify the shape, not the words.
 *
 * Requires TEST_DATABASE_URL to be set.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { getProductCatalog, getCatalogProduct, getAllProductsAdmin, getComingSoonProducts } from "../src/catalog.js"
import {
  testDb,
  cleanDatabase,
  createTestProduct,
  createTestPlan,
} from "@repo/testing"

beforeEach(cleanDatabase)

afterAll(async () => {
  await testDb.$disconnect()
})

// ─── getProductCatalog ────────────────────────────────────────────────────────

describe("getProductCatalog", () => {
  it("returns only ACTIVE products", async () => {
    await createTestProduct({ slug: "active-product", name: "Active" })
    await testDb.product.create({
      data: { slug: "coming-soon-product", name: "Coming Soon", status: "COMING_SOON" },
    })
    await testDb.product.create({
      data: { slug: "deprecated-product", name: "Deprecated", status: "DEPRECATED" },
    })

    const catalog = await getProductCatalog()

    const slugs = catalog.products.map((p) => p.slug)
    expect(slugs).toContain("active-product")
    expect(slugs).not.toContain("coming-soon-product")
    expect(slugs).not.toContain("deprecated-product")
  })

  it("returns only public plans for each product", async () => {
    const product = await createTestProduct({ slug: "plan-visibility" })
    await createTestPlan({ productId: product.id }) // isPublic=true by default
    await testDb.plan.create({
      data: {
        productId: product.id,
        slug: "private-plan",
        name: "Private Plan",
        billingInterval: "MONTH",
        displayPrice: 9900,
        isPublic: false,
        status: "ACTIVE",
      },
    })

    const catalog = await getProductCatalog()
    const p = catalog.products.find((p) => p.slug === "plan-visibility")
    expect(p).toBeDefined()
    const planSlugs = p!.plans.map((pl) => pl.slug)
    expect(planSlugs).not.toContain("private-plan")
  })

  it("returns only ACTIVE plans (not LEGACY or DEPRECATED)", async () => {
    const product = await createTestProduct({ slug: "plan-status" })
    await createTestPlan({ productId: product.id, status: "ACTIVE" })
    await createTestPlan({ productId: product.id, status: "LEGACY" })
    await createTestPlan({ productId: product.id, status: "DEPRECATED" })

    const catalog = await getProductCatalog()
    const p = catalog.products.find((p) => p.slug === "plan-status")
    expect(p!.plans).toHaveLength(1)
    expect(p!.plans[0]!.status).toBeUndefined() // CatalogPlan doesn't expose status directly
  })

  it("returns products sorted by sortOrder ascending", async () => {
    await testDb.product.create({
      data: { slug: "sort-3", name: "Third", status: "ACTIVE", sortOrder: 3 },
    })
    await testDb.product.create({
      data: { slug: "sort-1", name: "First", status: "ACTIVE", sortOrder: 1 },
    })
    await testDb.product.create({
      data: { slug: "sort-2", name: "Second", status: "ACTIVE", sortOrder: 2 },
    })

    const catalog = await getProductCatalog()
    const slugs = catalog.products.map((p) => p.slug)
    const indices = ["sort-1", "sort-2", "sort-3"].map((s) => slugs.indexOf(s))
    expect(indices[0]).toBeLessThan(indices[1]!)
    expect(indices[1]).toBeLessThan(indices[2]!)
  })

  it("includes billing configuration in the response", async () => {
    const catalog = await getProductCatalog()
    expect(catalog.billing).toBeDefined()
    expect(typeof catalog.billing.isLive).toBe("boolean")
    expect(catalog.billing.providerName).toBeDefined()
  })

  it("returns formattedPrice as a currency string", async () => {
    const product = await createTestProduct({ slug: "fmt-price" })
    await createTestPlan({ productId: product.id, displayPrice: 4900 })

    const catalog = await getProductCatalog()
    const p = catalog.products.find((p) => p.slug === "fmt-price")
    expect(p!.plans[0]!.formattedPrice).toMatch(/\$/)
  })

  it("returns empty products array when no ACTIVE products exist", async () => {
    const catalog = await getProductCatalog()
    expect(catalog.products).toEqual([])
  })
})

// ─── getCatalogProduct ────────────────────────────────────────────────────────

describe("getCatalogProduct", () => {
  it("returns a product by slug", async () => {
    const product = await createTestProduct({ slug: "my-product", name: "My Product" })
    await createTestPlan({ productId: product.id })

    const result = await getCatalogProduct("my-product")

    expect(result).not.toBeNull()
    expect(result!.slug).toBe("my-product")
  })

  it("returns null for an unknown slug", async () => {
    const result = await getCatalogProduct("does-not-exist")
    expect(result).toBeNull()
  })

  it("includes private plans (unlike the public catalog)", async () => {
    const product = await createTestProduct({ slug: "admin-view" })
    await testDb.plan.create({
      data: {
        productId: product.id,
        slug: "private-admin-plan",
        name: "Private",
        billingInterval: "MONTH",
        displayPrice: 0,
        isPublic: false,
        status: "ACTIVE",
      },
    })

    const result = await getCatalogProduct("admin-view")
    const slugs = result!.plans.map((p) => p.slug)
    expect(slugs).toContain("private-admin-plan")
  })

  it("returns null for a DEPRECATED product", async () => {
    await testDb.product.create({
      data: { slug: "old-product", name: "Old", status: "DEPRECATED" },
    })

    const result = await getCatalogProduct("old-product")
    expect(result).toBeNull()
  })
})

// ─── getAllProductsAdmin ──────────────────────────────────────────────────────

describe("getAllProductsAdmin", () => {
  it("returns products of all statuses", async () => {
    await createTestProduct({ slug: "admin-active" })
    await testDb.product.create({
      data: { slug: "admin-coming-soon", name: "CS", status: "COMING_SOON" },
    })
    await testDb.product.create({
      data: { slug: "admin-deprecated", name: "Dep", status: "DEPRECATED" },
    })

    const products = await getAllProductsAdmin()
    const slugs = products.map((p) => p.slug)
    expect(slugs).toContain("admin-active")
    expect(slugs).toContain("admin-coming-soon")
    expect(slugs).toContain("admin-deprecated")
  })
})

// ─── getComingSoonProducts ────────────────────────────────────────────────────

describe("getComingSoonProducts", () => {
  it("returns only COMING_SOON products", async () => {
    await createTestProduct({ slug: "live-product" })
    await testDb.product.create({
      data: { slug: "teaser-product", name: "Teaser", status: "COMING_SOON" },
    })

    const products = await getComingSoonProducts()
    const slugs = products.map((p) => p.slug)
    expect(slugs).toContain("teaser-product")
    expect(slugs).not.toContain("live-product")
  })
})
