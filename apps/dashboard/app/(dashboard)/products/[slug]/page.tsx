import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { requireOrg } from "../../../../lib/auth"
import { getDashboardProduct } from "../../../../lib/billing"
import { checkEntitlement } from "@repo/billing"
import { Badge } from "../../../../components/ui/badge"
import { ChevronRight, Layers } from "../../../../components/ui/icons"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getDashboardProduct(slug)
  return { title: product?.name ?? "Product" }
}

function formatBillingInterval(interval: string): string {
  switch (interval) {
    case "MONTH":
      return "/ mo"
    case "YEAR":
      return "/ yr"
    case "FREE":
      return "free"
    case "ONE_TIME":
      return "one-time"
    default:
      return interval.toLowerCase()
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const { org } = await requireOrg()

  const [product, entitlement] = await Promise.all([
    getDashboardProduct(slug),
    checkEntitlement({ orgId: org.id, productSlug: slug }),
  ])

  if (!product) notFound()
  if (!entitlement.hasAccess) redirect("/products")

  return (
    <div className="space-y-8">
      {/* Back link + header */}
      <div>
        <Link
          href="/products"
          className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-300"
        >
          <ChevronRight size={14} className="rotate-180" />
          My Products
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{product.name}</h1>
        {product.content?.tagline && (
          <p className="mt-1 text-sm text-zinc-400">{product.content.tagline}</p>
        )}
      </div>

      {/* Access summary card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Access</p>
        <div className="divide-y divide-zinc-800">
          {/* Source row */}
          <div className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-zinc-400">Source</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-100">
                {entitlement.source === "subscription" ? "Subscription" : "Complimentary"}
              </span>
              {entitlement.source === "subscription" ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="secondary">Granted</Badge>
              )}
            </div>
          </div>

          {/* Plan row — only when access is via subscription */}
          {entitlement.plan && (
            <div className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-zinc-400">Plan</span>
              <span className="font-medium text-zinc-100">
                {entitlement.plan.name}{" "}
                <span className="font-normal text-zinc-500">
                  {formatBillingInterval(entitlement.plan.billingInterval)}
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Value proposition */}
      {product.content?.valueProposition && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-2 text-sm font-semibold text-zinc-300">About</h2>
          <p className="text-sm leading-relaxed text-zinc-400">{product.content.valueProposition}</p>
        </div>
      )}

      {/* Workspace placeholder */}
      <div className="rounded-xl border border-dashed border-zinc-800 p-10 text-center">
        <Layers size={24} className="mx-auto mb-3 text-zinc-700" />
        <p className="text-sm font-medium text-zinc-500">Product workspace coming soon</p>
        <p className="mt-1 text-xs text-zinc-600">
          This is where your {product.name} workspace will appear.
        </p>
      </div>
    </div>
  )
}
