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
          <Check size={16} className="text-emerald-400" aria-label="Included" />
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center">
        <Minus size={16} className="text-white/20" aria-label="Not included" />
      </span>
    )
  }
  if (value === "unlimited") return <span className="font-medium text-white">Unlimited</span>
  if (value === "custom") return <span className="font-medium text-white">Custom</span>
  return <span className="text-slate-300">{value}</span>
}

export function ComparisonTable({ product }: ComparisonTableProps) {
  const { plans, comparisonConfig } = product

  if (plans.length === 0 || comparisonConfig.length === 0) return null

  const featureMap = new Map(
    plans.map((plan) => [plan.id, new Map(plan.features.map((f) => [f.key, f]))]),
  )

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.08]">
      <table className="w-full min-w-[600px] text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] bg-white/[0.04]">
            <th className="w-2/5 py-4 pl-6 pr-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
              Feature
            </th>
            {plans.map((plan) => (
              <th key={plan.id} className="px-4 py-4 text-center text-sm font-bold text-white">
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
                "border-b border-white/[0.05] last:border-0",
                rowIdx % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]",
              )}
            >
              <td className="py-3 pl-6 pr-3 font-medium text-slate-400">
                {row.label}
                {row.hint && (
                  <span className="ml-1.5 text-xs text-slate-600" title={row.hint}>
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
                      <Minus size={14} className="mx-auto text-white/15" />
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
