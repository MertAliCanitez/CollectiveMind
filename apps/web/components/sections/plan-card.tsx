import Link from "next/link"
import { cn } from "@repo/ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Minus } from "@/components/ui/icons"
import type { CatalogPlan } from "@repo/billing"
import type { PlanBadge } from "@repo/billing"

interface PlanCardProps {
  plan: CatalogPlan
  billingEnabled: boolean
  /** Highlight this card as the featured/popular tier */
  featured?: boolean
}

const badgeVariantMap: Record<PlanBadge, "popular" | "secondary" | "enterprise"> = {
  most_popular: "popular",
  best_value: "secondary",
  enterprise: "enterprise",
}

const badgeLabelMap: Record<PlanBadge, string> = {
  most_popular: "Most popular",
  best_value: "Best value",
  enterprise: "Enterprise",
}

function formatBillingInterval(interval: string, price: number): string {
  if (price === 0 || interval === "FREE") return "Free forever"
  if (interval === "MONTH") return "per month"
  if (interval === "YEAR") return "per year"
  if (interval === "ONE_TIME") return "one-time"
  return ""
}

function formatFeatureValue(value: string, format: string | null): React.ReactNode {
  if (format === "boolean") {
    if (value === "true") return <Check size={16} className="text-emerald-500" />
    return <Minus size={16} className="text-slate-300" />
  }
  if (value === "unlimited") return "Unlimited"
  if (value === "custom") return "Custom"
  return value
}

export function PlanCard({ plan, billingEnabled, featured = false }: PlanCardProps) {
  const content = plan.content
  const badge = content?.badge
  const isFree = plan.displayPrice === 0 || plan.billingInterval === "FREE"

  // Determine CTA
  const ctaLabel = billingEnabled
    ? (content?.ctaLabel ?? "Get started")
    : isFree
      ? "Request free access"
      : "Contact us"

  const ctaHref = billingEnabled && !isFree ? "/contact" : "/contact"

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl p-6 sm:p-8",
        featured
          ? "bg-slate-900 text-white shadow-xl ring-2 ring-indigo-500"
          : "border border-slate-200 bg-white shadow-sm",
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant={badgeVariantMap[badge]} className="shadow-sm">
            {badgeLabelMap[badge]}
          </Badge>
        </div>
      )}

      {/* Plan name & tagline */}
      <div>
        <h3 className={cn("text-lg font-bold", featured ? "text-white" : "text-slate-900")}>
          {plan.name}
        </h3>
        {content?.tagline && (
          <p className={cn("mt-1 text-sm", featured ? "text-slate-300" : "text-slate-500")}>
            {content.tagline}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="mt-5">
        {isFree ? (
          <div>
            <span
              className={cn(
                "text-4xl font-bold tracking-tight",
                featured ? "text-white" : "text-slate-900",
              )}
            >
              $0
            </span>
            <span className={cn("ml-2 text-sm", featured ? "text-slate-400" : "text-slate-400")}>
              free forever
            </span>
          </div>
        ) : (
          <div>
            <span
              className={cn(
                "text-4xl font-bold tracking-tight",
                featured ? "text-white" : "text-slate-900",
              )}
            >
              {plan.formattedPrice}
            </span>
            <span className={cn("ml-2 text-sm", featured ? "text-slate-400" : "text-slate-400")}>
              {formatBillingInterval(plan.billingInterval, plan.displayPrice)}
            </span>
          </div>
        )}
      </div>

      {/* Not-yet-live notice */}
      {!billingEnabled && !isFree && (
        <p className={cn("mt-2 text-xs", featured ? "text-indigo-300" : "text-indigo-500")}>
          Payments coming soon — contact us for access
        </p>
      )}

      {/* CTA */}
      <div className="mt-6">
        <Button
          variant={featured ? "default" : "outline"}
          size="md"
          asChild
          className={cn("w-full", featured && "border-0 bg-indigo-500 hover:bg-indigo-400")}
        >
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </div>

      {/* Highlights */}
      {content?.highlights && content.highlights.length > 0 && (
        <ul className="mt-7 space-y-2.5">
          {content.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2.5">
              <Check
                size={15}
                className={cn("mt-0.5 shrink-0", featured ? "text-indigo-400" : "text-indigo-500")}
              />
              <span className={cn("text-sm", featured ? "text-slate-300" : "text-slate-600")}>
                {h}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Raw features (when no highlight content) */}
      {(!content?.highlights || content.highlights.length === 0) && plan.features.length > 0 && (
        <ul className="mt-7 space-y-2.5">
          {plan.features.slice(0, 6).map((f) => (
            <li key={f.key} className="flex items-center justify-between">
              <span className={cn("text-sm", featured ? "text-slate-300" : "text-slate-600")}>
                {f.label ?? f.key.replace(/_/g, " ")}
              </span>
              <span
                className={cn("text-sm font-medium", featured ? "text-white" : "text-slate-900")}
              >
                {formatFeatureValue(f.value, f.format)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
