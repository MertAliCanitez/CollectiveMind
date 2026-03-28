/**
 * Integration tests for admin product data layer.
 *
 * These tests verify the CRUD operations that power the admin product
 * management UI. They test DB queries directly — no HTTP, no Server Actions.
 *
 * Requires TEST_DATABASE_URL to be set.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { listProducts, getProduct, createProduct, updateProduct } from "../../../lib/admin/products"
import { testDb, cleanDatabase, createTestProduct, createTestPlan } from "@repo/testing"

beforeEach(cleanDatabase)

afterAll(async () => {
  await testDb.$disconnect()
})

// ─── listProducts ─────────────────────────────────────────────────────────────

describe("listProducts", () => {
  it("returns an empty array when no products exist", async () => {
    const products = await listProducts()
    expect(products).toEqual([])
  })

  it("returns products sorted by sortOrder ascending", async () => {
    await testDb.product.create({ data: { slug: "b", name: "B", sortOrder: 2 } })
    await testDb.product.create({ data: { slug: "a", name: "A", sortOrder: 1 } })
    await testDb.product.create({ data: { slug: "c", name: "C", sortOrder: 3 } })

    const products = await listProducts()
    const slugs = products.map((p) => p.slug)
    expect(slugs).toEqual(["a", "b", "c"])
  })

  it("includes the plan count for each product", async () => {
    const product = await createTestProduct()
    await createTestPlan({ productId: product.id })
    await createTestPlan({ productId: product.id })

    const products = await listProducts()
    const found = products.find((p) => p.id === product.id)
    expect(found!.planCount).toBe(2)
  })

  it("returns zero plan count for a product with no plans", async () => {
    await createTestProduct()

    const products = await listProducts()
    expect(products[0]!.planCount).toBe(0)
  })

  it("returns all required fields", async () => {
    await createTestProduct({ slug: "complete-product", name: "Complete" })

    const products = await listProducts()
    const p = products[0]!
    expect(p).toHaveProperty("id")
    expect(p).toHaveProperty("slug")
    expect(p).toHaveProperty("name")
    expect(p).toHaveProperty("status")
    expect(p).toHaveProperty("sortOrder")
    expect(p).toHaveProperty("planCount")
    expect(p).toHaveProperty("createdAt")
  })
})

// ─── getProduct ───────────────────────────────────────────────────────────────

describe("getProduct", () => {
  it("returns a product by ID", async () => {
    const product = await createTestProduct({ slug: "find-me", name: "Find Me" })

    const found = await getProduct(product.id)
    expect(found).not.toBeNull()
    expect(found!.slug).toBe("find-me")
  })

  it("returns null for a nonexistent ID", async () => {
    const result = await getProduct("00000000-0000-0000-0000-000000000000")
    expect(result).toBeNull()
  })
})

// ─── createProduct ────────────────────────────────────────────────────────────

describe("createProduct", () => {
  it("creates a product with required fields", async () => {
    const product = await createProduct({
      slug: "new-product",
      name: "New Product",
      status: "ACTIVE",
    })

    expect(product.slug).toBe("new-product")
    expect(product.name).toBe("New Product")
    expect(product.status).toBe("ACTIVE")
    expect(product.sortOrder).toBe(0) // default
    expect(product.description).toBeNull()
  })

  it("creates with description and sortOrder", async () => {
    const product = await createProduct({
      slug: "described-product",
      name: "Described",
      status: "COMING_SOON",
      description: "A test product",
      sortOrder: 5,
    })

    expect(product.description).toBe("A test product")
    expect(product.sortOrder).toBe(5)
    expect(product.status).toBe("COMING_SOON")
  })

  it("assigns a UUID as the product ID", async () => {
    const product = await createProduct({ slug: "uuid-test", name: "UUID", status: "ACTIVE" })
    expect(product.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it("throws on duplicate slug (enforced by unique constraint)", async () => {
    await createProduct({ slug: "unique-slug", name: "First", status: "ACTIVE" })

    await expect(
      createProduct({ slug: "unique-slug", name: "Second", status: "ACTIVE" }),
    ).rejects.toThrow()
  })
})

// ─── updateProduct ────────────────────────────────────────────────────────────

describe("updateProduct", () => {
  it("updates the name", async () => {
    const product = await createTestProduct({ name: "Old Name" })

    const updated = await updateProduct(product.id, { name: "New Name" })

    expect(updated.name).toBe("New Name")
  })

  it("updates the status", async () => {
    const product = await createTestProduct()
    expect(product.status).toBe("ACTIVE")

    const updated = await updateProduct(product.id, { status: "DEPRECATED" })

    expect(updated.status).toBe("DEPRECATED")
  })

  it("updates the description (including to null)", async () => {
    const product = await createProduct({
      slug: "with-desc",
      name: "With Desc",
      status: "ACTIVE",
      description: "Initial desc",
    })

    const cleared = await updateProduct(product.id, { description: null })
    expect(cleared.description).toBeNull()
  })

  it("does not modify fields not included in the update", async () => {
    const product = await createTestProduct({ slug: "partial-update" })

    await updateProduct(product.id, { sortOrder: 99 })

    const refreshed = await testDb.product.findUnique({ where: { id: product.id } })
    expect(refreshed!.slug).toBe("partial-update")
    expect(refreshed!.sortOrder).toBe(99)
    expect(refreshed!.name).toBe(product.name) // unchanged
  })
})
