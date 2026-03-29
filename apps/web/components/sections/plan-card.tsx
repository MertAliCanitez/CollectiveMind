import Link from "next/link"
import { cn } from "@repo/ui"
import { Badge } from "@/components/ui/badge"
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
    if (value === "true") return <Check size={16} className="text-emerald-400" />
    return <Minus size={16} className="text-white/20" />
  }
  if (value === "unlimited") return "Unlimited"
  if (value === "custom") return "Custom"
  return value
}

export function PlanCard({ plan, billingEnabled, featured = false }: PlanCardProps) {
  const content = plan.content
  const badge = content?.badge
  const isFree = plan.displayPrice === 0 || plan.billingInterval === "FREE"

  const ctaLabel = billingEnabled
    ? (content?.ctaLabel ?? "Get started")
    : isFree
      ? "Request free access"
      : "Contact us"

  const ctaHref = "/contact"

  if (featured) {
    return (
      /* Gradient-border wrapper */
      <div className="relative rounded-2xl p-px bg-gradient-to-b from-violet-500/50 via-blue-500/25 to-transparent shadow-[0_16px_48px_rgba(0,0,0,0.6)]">
        {badge && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
            <Badge variant={badgeVariantMap[badge]} className="shadow-sm">
              {badgeLabelMap[badge]}
            </Badge>
          </div>
        )}
        <div className="relative flex flex-col rounded-2xl bg-[#0d0d1f] p-6 sm:p-8">
          {/* Top shimmer line */}
          <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />

          <h3 className="text-lg font-bold text-white">{plan.name}</h3>
          {content?.tagline && (
            <p className="mt-1 text-sm bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent font-medium">
              {content.tagline}
            </p>
          )}

          <div className="mt-5">
            {isFree ? (
              <div>
                <span className="text-4xl font-bold tracking-tight text-white">$0</span>
                <span className="ml-2 text-sm text-slate-400">free forever</span>
              </div>
            ) : (
              <div>
                <span className="text-4xl font-bold tracking-tight text-white">
                  {plan.formattedPrice}
                </span>
                <span className="ml-2 text-sm text-slate-400">
                  {formatBillingInterval(plan.billingInterval, plan.displayPrice)}
                </span>
              </div>
            )}
          </div>

          {!billingEnabled && !isFree && (
            <p className="mt-2 text-xs text-blue-400">Payments coming soon — contact us for access</p>
          )}

          <div className="mt-6">
            <Link
              href={ctaHref}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
            >
              {ctaLabel}
            </Link>
          </div>

          {content?.highlights && content.highlights.length > 0 && (
            <ul className="mt-7 space-y-2.5">
              {content.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2.5">
                  <Check size={15} className="mt-0.5 shrink-0 text-blue-400" />
                  <span className="text-sm text-slate-300">{h}</span>
                </li>
              ))}
            </ul>
          )}

          {(!content?.highlights || content.highlights.length === 0) && plan.features.length > 0 && (
            <ul className="mt-7 space-y-2.5">
              {plan.features.slice(0, 6).map((f) => (
                <li key={f.key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {f.label ?? f.key.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-medium text-white">
                    {formatFeatureValue(f.value, f.format)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.13] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] sm:p-8",
      )}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant={badgeVariantMap[badge]} className="shadow-sm">
            {badgeLabelMap[badge]}
          </Badge>
        </div>
      )}

      <h3 className="text-lg font-bold text-white">{plan.name}</h3>
      {content?.tagline && (
        <p className="mt-1 text-sm text-slate-400">{content.tagline}</p>
      )}

      <div className="mt-5">
        {isFree ? (
          <div>
            <span className="text-4xl font-bold tracking-tight text-white">$0</span>
            <span className="ml-2 text-sm text-slate-400">free forever</span>
          </div>
        ) : (
          <div>
            <span className="text-4xl font-bold tracking-tight text-white">
              {plan.formattedPrice}
            </span>
            <span className="ml-2 text-sm text-slate-400">
              {formatBillingInterval(plan.billingInterval, plan.displayPrice)}
            </span>
          </div>
        )}
      </div>

      {!billingEnabled && !isFree && (
        <p className="mt-2 text-xs text-slate-500">Payments coming soon — contact us for access</p>
      )}

      <div className="mt-6">
        <Link
          href={ctaHref}
          className="flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-300 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.09] hover:text-white"
        >
          {ctaLabel}
        </Link>
      </div>

      {content?.highlights && content.highlights.length > 0 && (
        <ul className="mt-7 space-y-2.5">
          {content.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2.5">
              <Check size={15} className="mt-0.5 shrink-0 text-blue-400/70" />
              <span className="text-sm text-slate-400">{h}</span>
            </li>
          ))}
        </ul>
      )}

      {(!content?.highlights || content.highlights.length === 0) && plan.features.length > 0 && (
        <ul className="mt-7 space-y-2.5">
          {plan.features.slice(0, 6).map((f) => (
            <li key={f.key} className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {f.label ?? f.key.replace(/_/g, " ")}
              </span>
              <span className="text-sm font-medium text-white">
                {formatFeatureValue(f.value, f.format)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
