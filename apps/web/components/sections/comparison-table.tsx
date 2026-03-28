import { cn } from "@repo/ui"
import { Check, Minus } from "@/components/ui/icons"
import type { CatalogProduct } from "@repo/billing"

interface ComparisonTableProps {
  product: CatalogProduct
}

function renderValue(value: string, format: string | null): React.ReactNode {
  if (format === "boolean") {
    if (value === "true") {
      return (
        <span className="inline-flex items-center justify-center">
          <Check size={16} className="text-emerald-500" aria-label="Included" />
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center">
        <Minus size={16} className="text-slate-300" aria-label="Not included" />
      </span>
    )
  }
  if (value === "unlimited") return <span className="font-medium text-slate-900">Unlimited</span>
  if (value === "custom") return <span className="font-medium text-slate-900">Custom</span>
  return <span className="text-slate-700">{value}</span>
}

export function ComparisonTable({ product }: ComparisonTableProps) {
  const { plans, comparisonConfig } = product

  if (plans.length === 0 || comparisonConfig.length === 0) return null

  // Build a lookup: planId → feature key → value
  const featureMap = new Map(
    plans.map((plan) => [plan.id, new Map(plan.features.map((f) => [f.key, f]))]),
  )

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="w-2/5 py-4 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-400">
              Feature
            </th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-4 py-4 text-center text-sm font-bold text-slate-900">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparisonConfig.map((row, rowIdx) => (
            <tr
              key={row.key}
              className={cn(
                "border-b border-slate-100 last:border-0",
                rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50",
              )}
            >
              <td className="py-3 pl-6 pr-3 font-medium text-slate-700">
                {row.label}
                {row.hint && (
                  <span className="ml-1.5 text-xs text-slate-400" title={row.hint}>
                    ⓘ
                  </span>
                )}
              </td>
              {plans.map((plan) => {
                const feature = featureMap.get(plan.id)?.get(row.key)
                return (
                  <td key={plan.id} className="px-4 py-3 text-center text-sm">
                    {feature ? (
                      renderValue(feature.value, feature.format)
                    ) : (
                      <Minus size={14} className="mx-auto text-slate-200" />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
