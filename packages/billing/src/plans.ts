/**
 * Plan query helpers.
 * Used by marketing pages, admin panel, and billing settings.
 */
import { db } from "@repo/database"

/** All public plans for a product, ordered for display on pricing pages. */
export async function getPublicPlans(productSlug: string) {
  return db.plan.findMany({
    where: {
      product: { slug: productSlug },
      isPublic: true,
      status: "ACTIVE",
    },
    include: {
      features: { orderBy: { key: "asc" } },
      product: { select: { slug: true, name: true } },
    },
    orderBy: { sortOrder: "asc" },
  })
}

/** All plans for all active products — used on the platform pricing page. */
export async function getAllPublicPlans() {
  return db.plan.findMany({
    where: {
      isPublic: true,
      status: "ACTIVE",
      product: { status: "ACTIVE" },
    },
    include: {
      features: { orderBy: { key: "asc" } },
      product: { select: { slug: true, name: true, sortOrder: true } },
    },
    orderBy: [{ product: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  })
}

/** Plan by slug — used in checkout flows. */
export async function getPlanBySlug(slug: string) {
  return db.plan.findUnique({
    where: { slug },
    include: {
      features: true,
      product: true,
    },
  })
}
