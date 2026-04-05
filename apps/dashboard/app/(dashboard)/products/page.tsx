import type { Metadata } from "next"
import { requireOrg } from "../../../lib/auth"
import { getDashboardAccessibleProducts } from "../../../lib/billing"
import { ProductAccessCard } from "../../../components/product-access-card"
import { EmptyState } from "../../../components/empty-state"

export const metadata: Metadata = {
  title: "My Products",
}

export default async function ProductsPage() {
  const { org } = await requireOrg()

  const products = await getDashboardAccessibleProducts(org.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">My Products</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {products.length > 0
            ? `Your organization has access to ${products.length} product${products.length !== 1 ? "s" : ""}.`
            : "Products your organization has subscribed to will appear here."}
        </p>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Contact your account admin or reach out to our team to enable product access for your organization."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductAccessCard
              key={product.id}
              product={product}
              entitlement={{
                hasAccess: true,
                source: product.accessSource,
                plan: product.activePlan ?? null,
                featureValue: () => null,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
