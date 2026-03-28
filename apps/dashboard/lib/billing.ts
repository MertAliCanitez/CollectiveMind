/**
 * Safe billing wrappers for the dashboard.
 *
 * All functions return null / empty defaults on error so pages
 * degrade gracefully when billing DB is unavailable in dev/test.
 */
import {
  getOrgBillingStatus,
  getProductCatalog,
  checkEntitlement,
  type OrgBillingStatus,
  type ProductCatalog,
  type Entitlement,
} from "@repo/billing"

export async function getDashboardBillingStatus(orgId: string): Promise<OrgBillingStatus | null> {
  try {
    return await getOrgBillingStatus(orgId)
  } catch {
    return null
  }
}

export async function getDashboardCatalog(): Promise<ProductCatalog | null> {
  try {
    return await getProductCatalog()
  } catch {
    return null
  }
}

export async function getDashboardEntitlement(
  orgId: string,
  productSlug: string,
): Promise<Entitlement | null> {
  try {
    return await checkEntitlement({ orgId, productSlug })
  } catch {
    return null
  }
}

export type { OrgBillingStatus, ProductCatalog, Entitlement }
