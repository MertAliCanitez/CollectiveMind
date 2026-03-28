/**
 * Safe wrappers around @repo/billing catalog functions.
 *
 * These catch database errors (e.g. no DB in dev) and return null so pages
 * render empty states instead of crashing. The UI handles null by showing
 * appropriate messaging.
 */
import {
  getProductCatalog as _getProductCatalog,
  getCatalogProduct as _getCatalogProduct,
  getComingSoonProducts as _getComingSoonProducts,
} from "@repo/billing"
import type { ProductCatalog, CatalogProduct } from "@repo/billing"

export async function getProductCatalog(): Promise<ProductCatalog | null> {
  try {
    return await _getProductCatalog()
  } catch {
    return null
  }
}

export async function getCatalogProduct(slug: string): Promise<CatalogProduct | null> {
  try {
    return await _getCatalogProduct(slug)
  } catch {
    return null
  }
}

export async function getComingSoonProducts(): Promise<CatalogProduct[]> {
  try {
    return await _getComingSoonProducts()
  } catch {
    return []
  }
}
