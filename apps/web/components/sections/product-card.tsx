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
    /* Gradient-border wrapper using the p-px technique */
    <div
      className={cn(
        "rounded-2xl p-px transition-all duration-300",
        isComingSoon
          ? "bg-white/[0.06] opacity-70"
          : "bg-gradient-to-b from-violet-500/30 via-blue-500/15 to-transparent hover:from-violet-500/50 hover:via-blue-500/25 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
      )}
    >
      <div
        className={cn(
          "group relative flex h-full flex-col rounded-2xl bg-[#0d0d1f] p-6 transition-all duration-300 sm:p-8",
          !isComingSoon && "hover:-translate-y-0.5",
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
          <h3 className="text-xl font-bold text-white">{product.name}</h3>
          {product.content && (
            <p className="mt-1 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-sm font-medium text-transparent">
              {product.content.tagline}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            {product.content?.valueProposition ?? "Details coming soon."}
          </p>
        </div>

        {/* Plan count + starting price */}
        {!isComingSoon && planCount > 0 && (
          <div className="mb-5 flex flex-wrap items-baseline gap-2">
            {lowestPlan && lowestPlan.displayPrice === 0 ? (
              <span className="text-sm font-medium text-slate-400">Free plan available</span>
            ) : lowestPlan ? (
              <span className="text-sm font-medium text-slate-400">
                Starting at{" "}
                <span className="font-semibold text-white">{lowestPlan.formattedPrice}</span>
                <span className="text-slate-500">
                  /{lowestPlan.billingInterval === "MONTH" ? "mo" : "yr"}
                </span>
              </span>
            ) : null}
            <Badge variant="secondary">
              {planCount} plan{planCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {/* CTA */}
        {!isComingSoon ? (
          <Link
            href={`/products/${product.slug}`}
            className="flex items-center gap-1 text-sm font-semibold text-blue-400 transition-colors duration-200 hover:text-blue-300"
          >
            Learn more
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </Link>
        ) : (
          <span className="text-sm text-slate-600">Notify me when available →</span>
        )}
      </div>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0d0d1f] p-6 sm:p-8">
      <div className="mb-4 h-6 w-1/3 animate-pulse rounded-lg bg-white/5" />
      <div className="mb-2 h-4 w-1/2 animate-pulse rounded-lg bg-white/5" />
      <div className="mb-1 h-4 w-full animate-pulse rounded-lg bg-white/5" />
      <div className="h-4 w-4/5 animate-pulse rounded-lg bg-white/5" />
    </div>
  )
}
