import type { Metadata } from "next"
import Link from "next/link"
import { requireOrg } from "../../../lib/auth"
import { getDashboardCatalog, getDashboardEntitlement } from "../../../lib/billing"
import { ProductAccessCard } from "../../../components/product-access-card"
import { EmptyState } from "../../../components/empty-state"
import { Badge } from "../../../components/ui/badge"
import { ArrowRight } from "../../../components/ui/icons"

export const metadata: Metadata = {
  title: "Home",
}

export default async function HomePage() {
  const { org, orgRole } = await requireOrg()

  const catalog = await getDashboardCatalog()
  const activeProducts = catalog?.products.filter((p) => p.status === "ACTIVE") ?? []

  // Check entitlement for each active product
  const entitlements = await Promise.all(
    activeProducts.map((p) => getDashboardEntitlement(org.id, p.slug)),
  )

  const accessibleProducts = activeProducts.filter((_, i) => entitlements[i]?.hasAccess)
  const isAdmin = orgRole === "org:admin"

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-400">{org.name} workspace</p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Products</p>
          <p className="mt-1 text-2xl font-bold text-zinc-100">{accessibleProducts.length}</p>
          <p className="mt-0.5 text-xs text-zinc-600">active</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Plan</p>
          <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
            {accessibleProducts.length > 0
              ? (entitlements.find((e) => e?.hasAccess)?.plan?.name ?? "—")
              : "None"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600">current</p>
        </div>
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Role</p>
          <div className="mt-1">
            <Badge variant={isAdmin ? "default" : "secondary"}>
              {isAdmin ? "Admin" : "Member"}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-zinc-600">in this org</p>
        </div>
      </div>

      {/* Product access section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Your Products</h2>
          <Link
            href="/products"
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {activeProducts.length === 0 ? (
          <EmptyState
            title="No products available"
            description="Check back soon — products are being configured."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeProducts.map((product, i) => (
              <ProductAccessCard
                key={product.id}
                product={product}
                entitlement={entitlements[i] ?? null}
              />
            ))}
          </div>
        )}
      </div>

      {/* Billing CTA for admins */}
      {isAdmin && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Billing &amp; Subscriptions</h3>
              <p className="mt-1 text-sm text-zinc-400">
                View your subscription status and manage billing settings.
              </p>
            </div>
            <Link
              href="/billing"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"
            >
              View billing <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
