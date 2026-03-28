/**
 * Entitlement checking.
 * The primary interface between product domains and the billing domain.
 * Product code calls checkEntitlement() — it never queries subscriptions directly.
 */
import { db } from "@repo/database"

export type Entitlement = {
  /** Whether the org has active access to this product */
  hasAccess: boolean
  /** The active plan, or null if no access */
  plan: {
    id: string
    slug: string
    name: string
    billingInterval: string
  } | null
  /** Look up a feature value from the active plan */
  featureValue: (key: string) => string | null
}

/**
 * Check whether an organization has access to a product,
 * and optionally look up a specific feature value.
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

  if (!subscription) {
    return {
      hasAccess: false,
      plan: null,
      featureValue: () => null,
    }
  }

  const features = subscription.plan.features

  return {
    hasAccess: true,
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
