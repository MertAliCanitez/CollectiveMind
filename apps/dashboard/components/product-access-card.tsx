import { cn } from "@repo/ui"
import { Badge } from "./ui/badge"
import { Check, ChevronRight, AlertCircle } from "./ui/icons"
import type { CatalogProduct } from "@repo/billing"
import type { Entitlement } from "@repo/billing"
import Link from "next/link"

interface ProductAccessCardProps {
  product: CatalogProduct
  entitlement: Entitlement | null
}

export function ProductAccessCard({ product, entitlement }: ProductAccessCardProps) {
  const hasAccess = entitlement?.hasAccess === true
  const planName = entitlement?.plan?.name
  const isComingSoon = product.status === "COMING_SOON"

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white p-5 transition-shadow",
        hasAccess
          ? "border-slate-200 hover:shadow-md hover:shadow-slate-100"
          : "border-slate-100 opacity-75",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-900">{product.name}</h3>
            {isComingSoon && <Badge variant="secondary">Coming soon</Badge>}
            {hasAccess && !isComingSoon && <Badge variant="success">Active</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.content?.tagline}</p>
        </div>
        {hasAccess && !isComingSoon && (
          <ChevronRight
            size={16}
            className="mt-0.5 shrink-0 text-slate-400 transition-colors group-hover:text-slate-600"
          />
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {hasAccess && planName ? (
          <>
            <Check size={14} className="shrink-0 text-emerald-500" />
            <span className="text-xs text-slate-600">
              {planName} plan
              {entitlement?.source === "grant" && (
                <span className="ml-1 text-slate-400">(complimentary)</span>
              )}
            </span>
          </>
        ) : isComingSoon ? (
          <span className="text-xs text-slate-500">Not yet available</span>
        ) : (
          <>
            <AlertCircle size={14} className="shrink-0 text-slate-400" />
            <span className="text-xs text-slate-500">No active subscription</span>
          </>
        )}
      </div>

      {/* Full-card link overlay for active products */}
      {hasAccess && !isComingSoon && (
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
          aria-label={`Open ${product.name}`}
        />
      )}
    </div>
  )
}
