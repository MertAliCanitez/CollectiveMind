/**
 * Entitlement checking.
 * The primary interface between product domains and the billing domain.
 * Product code calls checkEntitlement() — it never queries subscriptions directly.
 *
 * Access is granted when either:
 *   1. The org has an ACTIVE or TRIALING subscription for the product, OR
 *   2. The org has a non-revoked, non-expired AccessGrant for the product.
 *
 * AccessGrant is the manual override path (beta access, comped accounts, etc).
 * Subscription is the normal billing path.
 */
import { db } from "@repo/database"

export type Entitlement = {
  /** Whether the org has active access to this product */
  hasAccess: boolean
  /** The active plan, or null if no access (or if access is via AccessGrant) */
  plan: {
    id: string
    slug: string
    name: string
    billingInterval: string
  } | null
  /** How access was granted — useful for UI (e.g. show "beta" badge) */
  source: "subscription" | "grant" | "none"
  /** Look up a feature value from the active plan (always null for grant-based access) */
  featureValue: (key: string) => string | null
}

/**
 * Check whether an organization has access to a product,
 * and optionally look up a specific feature value.
 *
 * Checks subscription first. Falls back to AccessGrant if no active subscription.
 *
 * Cache this at request scope in Server Components using React's cache():
 *
 *   import { cache } from "react"
 *   const getCachedEntitlement = cache(checkEntitlement)
 */
export async function checkEntitlement(params: {
  orgId: string
  productSlug: string
}): Promise<Entitlement> {
  // 1. Check for an active or trialing subscription
  const subscription = await db.subscription.findFirst({
    where: {
      organizationId: params.orgId,
      status: { in: ["ACTIVE", "TRIALING"] },
      plan: {
        product: { slug: params.productSlug },
      },
    },
    include: {
      plan: {
        include: {
          features: true,
          product: { select: { slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  if (subscription) {
    const features = subscription.plan.features
    return {
      hasAccess: true,
      source: "subscription",
      plan: {
        id: subscription.plan.id,
        slug: subscription.plan.slug,
        name: subscription.plan.name,
        billingInterval: subscription.plan.billingInterval,
      },
      featureValue: (key: string) => {
        return features.find((f) => f.key === key)?.value ?? null
      },
    }
  }

  // 2. Fall back to an explicit AccessGrant (manual/beta access)
  const now = new Date()
  const grant = await db.accessGrant.findFirst({
    where: {
      organizationId: params.orgId,
      revokedAt: null,
      product: { slug: params.productSlug },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  })

  if (grant) {
    return {
      hasAccess: true,
      source: "grant",
      plan: null,
      featureValue: () => null,
    }
  }

  return {
    hasAccess: false,
    source: "none",
    plan: null,
    featureValue: () => null,
  }
}
