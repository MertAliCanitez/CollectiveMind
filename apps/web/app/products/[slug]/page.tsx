import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { SectionHeader } from "@/components/sections/section-header"
import { PlanCard } from "@/components/sections/plan-card"
import { ComparisonTable } from "@/components/sections/comparison-table"
import { CtaBand } from "@/components/sections/cta-band"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "@/components/ui/icons"
import { getCatalogProduct } from "@/lib/catalog"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getCatalogProduct(slug)
  if (!product) return {}

  const title = product.content?.tagline
    ? `${product.name} — ${product.content.tagline}`
    : product.name

  return {
    title,
    description: product.content?.valueProposition,
    openGraph: { title: `${title} — CollectiveMind`, description: product.content?.valueProposition },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getCatalogProduct(slug)

  // If DB not available, show a loading state rather than 404
  if (product === null) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center py-32 text-center">
        <p className="text-sm font-medium text-slate-400">Product not available right now</p>
        <p className="mt-1 text-xs text-slate-300">Database connection required</p>
        <Link
          href="/products"
          className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          ← Back to products
        </Link>
      </div>
    )
  }

  // Product exists but wasn't found by slug
  if (!product) notFound()

  const { content, plans, comparisonConfig } = product
  const billingEnabled = false // reads from catalog.billing.isLive in a real implementation

  // Determine featured plan (most_popular badge or middle tier)
  const featuredPlanSlug =
    plans.find((p) => p.content?.badge === "most_popular")?.slug ??
    plans[Math.floor(plans.length / 2)]?.slug

  const isComingSoon = product.status === "COMING_SOON"

  return (
    <>
      {/* Product hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-950 to-slate-900 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="mb-6 inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200"
          >
            ← All products
          </Link>

          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {product.name}
              </h1>
              {isComingSoon && <Badge variant="coming-soon">Coming soon</Badge>}
            </div>

            {content?.tagline && (
              <p className="text-lg font-medium text-indigo-400">{content.tagline}</p>
            )}

            {content?.valueProposition && (
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                {content.valueProposition}
              </p>
            )}

            {!isComingSoon && plans.length > 0 && (
              <div className="mt-8">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  See pricing
                  <ArrowRight size={14} />
                </a>
              </div>
            )}

            {isComingSoon && (
              <div className="mt-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
                >
                  Get notified when it launches
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Plans */}
      {!isComingSoon && plans.length > 0 && (
        <section id="pricing" className="bg-white py-20 sm:py-28 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Pricing"
              heading={`${product.name} plans`}
              subheading={
                billingEnabled
                  ? "Choose the plan that fits your team."
                  : "Payment processing is coming soon. Contact us for early access."
              }
            />

            {!billingEnabled && (
              <div className="mx-auto mt-6 max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-700">
                Payments not yet live — all plans available by request during early access.
              </div>
            )}

            <div
              className={`mt-12 grid grid-cols-1 gap-6 ${
                plans.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" :
                plans.length === 3 ? "sm:grid-cols-3" :
                "sm:grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingEnabled={billingEnabled}
                  featured={plan.slug === featuredPlanSlug}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison table */}
      {!isComingSoon && plans.length > 1 && comparisonConfig.length > 0 && (
        <section className="bg-slate-50 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Compare plans"
              heading="Feature comparison"
              subheading="A full breakdown of what's included in each plan."
            />
            <div className="mt-10">
              <ComparisonTable product={product} />
            </div>
          </div>
        </section>
      )}

      {/* Coming soon content */}
      {isComingSoon && (
        <section className="bg-slate-50 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
              In development
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              {product.name} is coming soon
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              We&apos;re building it now. Contact us to get early access or be
              notified when it launches.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
              >
                Request early access
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      <CtaBand
        heading={
          isComingSoon
            ? "Be the first to know"
            : `Ready to get started with ${product.name}?`
        }
        subheading={
          isComingSoon
            ? "Leave your details and we'll reach out when Workspace is ready."
            : "Talk to us — we'll find the right plan for your team."
        }
        ctaPrimary={{ label: "Contact us", href: "/contact" }}
        ctaSecondary={
          !isComingSoon ? { label: "View all products", href: "/products" } : undefined
        }
      />
    </>
  )
}
