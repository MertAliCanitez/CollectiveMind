import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "@/components/ui/icons"
import { cn } from "@repo/ui"
import type { CatalogProduct } from "@repo/billing"

interface ProductCardProps {
  product: CatalogProduct
}

export function ProductCard({ product }: ProductCardProps) {
  const isComingSoon = product.status === "COMING_SOON"
  const planCount = product.plans.length
  const lowestPlan = product.plans.find((p) => p.billingInterval === "FREE") ?? product.plans[0]

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow sm:p-8",
        isComingSoon
          ? "border-slate-200 opacity-75"
          : "border-slate-200 hover:shadow-md",
      )}
    >
      {/* Status badge */}
      {isComingSoon && (
        <div className="mb-4">
          <Badge variant="coming-soon">Coming soon</Badge>
        </div>
      )}

      {/* Product name & tagline */}
      <div className="mb-4 flex-1">
        <h3 className="text-xl font-bold text-slate-900">{product.name}</h3>
        {product.content && (
          <p className="mt-1 text-sm font-medium text-indigo-600">
            {product.content.tagline}
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          {product.content?.valueProposition ??
            "Details coming soon."}
        </p>
      </div>

      {/* Plan count + starting price */}
      {!isComingSoon && planCount > 0 && (
        <div className="mb-5 flex flex-wrap items-baseline gap-2">
          {lowestPlan && lowestPlan.displayPrice === 0 ? (
            <span className="text-sm font-medium text-slate-600">
              Free plan available
            </span>
          ) : lowestPlan ? (
            <span className="text-sm font-medium text-slate-600">
              Starting at{" "}
              <span className="text-slate-900 font-semibold">
                {lowestPlan.formattedPrice}
              </span>
              <span className="text-slate-400">
                /{lowestPlan.billingInterval === "MONTH" ? "mo" : "yr"}
              </span>
            </span>
          ) : null}
          <Badge variant="secondary">{planCount} plan{planCount !== 1 ? "s" : ""}</Badge>
        </div>
      )}

      {/* CTA */}
      {!isComingSoon ? (
        <Link
          href={`/products/${product.slug}`}
          className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Learn more
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      ) : (
        <span className="text-sm text-slate-400">Notify me when available →</span>
      )}
    </div>
  )
}

// Empty state shown when no products are available
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <div className="mb-4 h-6 w-1/3 animate-pulse rounded bg-slate-100" />
      <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mb-1 h-4 w-full animate-pulse rounded bg-slate-100" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
    </div>
  )
}
