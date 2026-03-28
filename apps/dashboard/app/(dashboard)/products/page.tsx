import type { Metadata } from "next"
import { requireOrg } from "../../../lib/auth"
import { getDashboardCatalog, getDashboardEntitlement } from "../../../lib/billing"
import { ProductAccessCard } from "../../../components/product-access-card"
import { EmptyState } from "../../../components/empty-state"
import { Badge } from "../../../components/ui/badge"

export const metadata: Metadata = {
  title: "My Products",
}

export default async function ProductsPage() {
  const { org } = await requireOrg()

  const catalog = await getDashboardCatalog()
  const allProducts = catalog?.products ?? []
  const activeProducts = allProducts.filter((p) => p.status === "ACTIVE")
  const comingSoonProducts = allProducts.filter((p) => p.status === "COMING_SOON")

  const entitlements = await Promise.all(
    activeProducts.map((p) => getDashboardEntitlement(org.id, p.slug)),
  )

  const accessibleCount = entitlements.filter((e) => e?.hasAccess).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Products</h1>
        <p className="mt-1 text-sm text-slate-500">
          {accessibleCount > 0
            ? `You have access to ${accessibleCount} of ${activeProducts.length} available product${activeProducts.length !== 1 ? "s" : ""}.`
            : "Products your organization has subscribed to will appear here."}
        </p>
      </div>

      {/* Active products */}
      {activeProducts.length === 0 ? (
        <EmptyState
          title="No products available"
          description="Check back soon — products are being configured."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProducts.map((product, i) => (
            <ProductAccessCard
              key={product.id}
              product={product}
              entitlement={entitlements[i] ?? null}
            />
          ))}
        </div>
      )}

      {/* Coming soon */}
      {comingSoonProducts.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Coming Soon
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoonProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-xl border border-dashed border-slate-200 bg-white p-5 opacity-60"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-700">{product.name}</h3>
                  <Badge variant="secondary">Coming soon</Badge>
                </div>
                {product.content?.tagline && (
                  <p className="mt-1 text-sm text-slate-400">{product.content.tagline}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade prompt if no access */}
      {accessibleCount === 0 && activeProducts.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-sm font-medium text-indigo-900">Interested in getting started?</p>
          <p className="mt-1 text-sm text-indigo-700">
            Contact your account admin or reach out to our team to enable product access for your
            organization.
          </p>
        </div>
      )}
    </div>
  )
}
