/**
 * Product catalog — enriched product and plan data for the UI.
 *
 * This module is the primary read API for product/plan data.
 * It merges DB records (entitlement data, pricing) with static content
 * (taglines, highlights, feature display labels) into a single typed response.
 *
 * Architecture:
 *
 *   DB (Product, Plan, PlanFeature)       ← entitlement + pricing source of truth
 *   product-content.ts (PRODUCT_CONTENT)  ← marketing copy, static, TypeScript
 *         │
 *         ▼
 *   getProductCatalog()                   ← this module, merges both
 *         │
 *         ▼
 *   UI (apps/web pricing page, apps/dashboard billing settings)
 *
 * Billing configuration:
 *   The catalog response includes `billingEnabled` (from PAYMENT_PROVIDER env var).
 *   When false, the UI should render CTAs as "Contact us" or "Coming soon for payments"
 *   rather than showing live checkout buttons.
 *
 * Caching:
 *   Cache at request scope in Server Components with React's cache():
 *     import { cache } from "react"
 *     const getCachedCatalog = cache(getProductCatalog)
 */
import { db } from "@repo/database"
import { formatCurrency } from "@repo/shared"
import { getBillingConfiguration } from "./status.js"
import { getProductContent, getPlanContent, getFeatureDisplayConfig } from "./product-content.js"
import type { ProductContent, PlanContent, FeatureDisplay } from "./product-content.js"
import type { BillingConfiguration } from "./types.js"

// ─── Catalog types ────────────────────────────────────────────────────────────

export interface CatalogFeature {
  key: string
  value: string
  /** Human-readable display label from PRODUCT_CONTENT, if registered */
  label: string | null
  /** How to format the value for display */
  format: FeatureDisplay["format"] | null
}

export interface CatalogPlan {
  id: string
  slug: string
  name: string
  billingInterval: string
  /** Raw price in cents (from DB) */
  displayPrice: number
  /** Formatted price string, e.g. "$49.00" */
  formattedPrice: string
  currency: string
  isPublic: boolean
  sortOrder: number
  features: CatalogFeature[]
  /** Marketing content from PRODUCT_CONTENT, null if not registered */
  content: PlanContent | null
}

export interface CatalogProduct {
  id: string
  slug: string
  name: string
  status: string
  sortOrder: number
  /** Plans ordered by sortOrder, only ACTIVE + public (unless includeAll is set) */
  plans: CatalogPlan[]
  /** Marketing content from PRODUCT_CONTENT, null if not registered */
  content: ProductContent | null
  /**
   * Ordered feature display config for rendering a comparison table.
   * Contains only the features that have display configuration registered.
   */
  comparisonConfig: FeatureDisplay[]
}

export interface ProductCatalog {
  /** Active products in sortOrder */
  products: CatalogProduct[]
  /** Whether a live payment provider is configured */
  billing: BillingConfiguration
}

/**
 * A product the org actually has access to, with the access source and active plan
 * included so the customer portal doesn't need a second entitlement lookup.
 *
 * Returned by getOrgAccessibleProducts(). Use this instead of the full catalog
 * in all customer-facing product lists.
 */
export interface OrgAccessibleProduct extends CatalogProduct {
  /** How this org was granted access to this product */
  accessSource: "subscription" | "grant"
  /**
   * The specific plan the org is subscribed to.
   * Null when access comes from an AccessGrant (no plan associated).
   */
  activePlan: {
    id: string
    slug: string
    name: string
    billingInterval: string
  } | null
}

// ─── Query + merge helpers ────────────────────────────────────────────────────

function buildCatalogPlan(
  plan: {
    id: string
    slug: string
    name: string
    billingInterval: string
    displayPrice: number
    currency: string
    isPublic: boolean
    sortOrder: number
    features: Array<{ key: string; value: string }>
  },
  featureConfig: FeatureDisplay[],
): CatalogPlan {
  const configByKey = new Map(featureConfig.map((f) => [f.key, f]))

  return {
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    billingInterval: plan.billingInterval,
    displayPrice: plan.displayPrice,
    formattedPrice: formatCurrency(plan.displayPrice, plan.currency),
    currency: plan.currency,
    isPublic: plan.isPublic,
    sortOrder: plan.sortOrder,
    features: plan.features.map((f) => {
      const config = configByKey.get(f.key)
      return {
        key: f.key,
        value: f.value,
        label: config?.label ?? null,
        format: config?.format ?? null,
      }
    }),
    content: getPlanContent(plan.slug),
  }
}

function buildCatalogProduct(product: {
  id: string
  slug: string
  name: string
  status: string
  sortOrder: number
  plans: Array<{
    id: string
    slug: string
    name: string
    billingInterval: string
    displayPrice: number
    currency: string
    isPublic: boolean
    sortOrder: number
    features: Array<{ key: string; value: string }>
  }>
}): CatalogProduct {
  const featureConfig = getFeatureDisplayConfig(product.slug)

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    status: product.status,
    sortOrder: product.sortOrder,
    plans: product.plans.map((plan) => buildCatalogPlan(plan, featureConfig)),
    content: getProductContent(product.slug),
    comparisonConfig: featureConfig,
  }
}

// Prisma include shape for a product with its public active plans, reused below
const productWithPlansInclude = {
  plans: {
    where: { status: "ACTIVE" as const, isPublic: true },
    include: { features: { orderBy: { key: "asc" as const } } },
    orderBy: { sortOrder: "asc" as const },
  },
} as const

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the full product catalog — all active products with their public plans,
 * enriched with marketing content and current billing configuration.
 *
 * Use this for:
 *   - Public pricing page (apps/web)
 *   - Plan selection during onboarding
 *   - Upgrade flows in the billing settings
 */
export async function getProductCatalog(): Promise<ProductCatalog> {
  const billing = getBillingConfiguration()

  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    include: productWithPlansInclude,
    orderBy: { sortOrder: "asc" },
  })

  return {
    products: products.map(buildCatalogProduct),
    billing,
  }
}

/**
 * Returns only the products that the given organization has active access to,
 * via either a Subscription (ACTIVE/TRIALING) or an AccessGrant (non-revoked,
 * non-expired).
 *
 * Uses exactly 2 DB queries regardless of how many products exist.
 * Subscription takes precedence when both a subscription and a grant exist for
 * the same product.
 *
 * Use this in all customer-facing product lists. The full catalog is intended
 * only for the public marketing site and admin views.
 */
export async function getOrgAccessibleProducts(orgId: string): Promise<OrgAccessibleProduct[]> {
  // Query 1 — all active/trialing subscriptions for this org
  const subscriptions = await db.subscription.findMany({
    where: {
      organizationId: orgId,
      status: { in: ["ACTIVE", "TRIALING"] },
    },
    include: {
      plan: {
        include: {
          product: { include: productWithPlansInclude },
          features: { orderBy: { key: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Query 2 — all active (non-revoked, non-expired) grants for this org
  const now = new Date()
  const grants = await db.accessGrant.findMany({
    where: {
      organizationId: orgId,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      product: { include: productWithPlansInclude },
    },
    orderBy: { createdAt: "desc" },
  })

  // Merge: subscription takes precedence over grant for the same product
  const result = new Map<string, OrgAccessibleProduct>()

  for (const sub of subscriptions) {
    const product = sub.plan.product
    if (!result.has(product.id)) {
      result.set(product.id, {
        ...buildCatalogProduct(product),
        accessSource: "subscription",
        activePlan: {
          id: sub.plan.id,
          slug: sub.plan.slug,
          name: sub.plan.name,
          billingInterval: sub.plan.billingInterval,
        },
      })
    }
  }

  for (const grant of grants) {
    const product = grant.product
    // Only add if there is no subscription-based entry for this product
    if (!result.has(product.id)) {
      result.set(product.id, {
        ...buildCatalogProduct(product),
        accessSource: "grant",
        activePlan: null,
      })
    }
  }

  return Array.from(result.values()).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Returns a single product with all its plans (public and private).
 * Used in admin and during checkout when you need the full picture.
 *
 * Returns null if the product does not exist or is not active.
 */
export async function getCatalogProduct(productSlug: string): Promise<CatalogProduct | null> {
  const product = await db.product.findFirst({
    where: { slug: productSlug, status: "ACTIVE" },
    include: {
      plans: {
        where: { status: "ACTIVE" },
        include: {
          features: { orderBy: { key: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!product) return null
  return buildCatalogProduct(product)
}

/**
 * Returns all products regardless of status — for admin views.
 * Includes deprecated and coming-soon products, and all plan states.
 */
export async function getAllProductsAdmin(): Promise<CatalogProduct[]> {
  const products = await db.product.findMany({
    include: {
      plans: {
        include: {
          features: { orderBy: { key: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return products.map(buildCatalogProduct)
}

/**
 * Returns all coming-soon products.
 * Used on the public site to show the product roadmap.
 */
export async function getComingSoonProducts(): Promise<CatalogProduct[]> {
  const products = await db.product.findMany({
    where: { status: "COMING_SOON" },
    include: {
      plans: {
        include: { features: { orderBy: { key: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  })

  return products.map(buildCatalogProduct)
}
