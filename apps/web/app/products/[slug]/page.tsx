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
    openGraph: {
      title: `${title} — CollectiveMind`,
      description: product.content?.valueProposition,
    },
  }
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params
  const product = await getCatalogProduct(slug)

  if (product === null) {
    return (
      <div className="flex min-h-96 flex-col items-center justify-center py-32 text-center">
        <p className="text-sm font-medium text-slate-400">Product not available right now</p>
        <p className="mt-1 text-xs text-slate-500">Database connection required</p>
        <Link href="/products" className="mt-6 text-sm font-semibold text-blue-400 hover:text-blue-300">
          ← Back to products
        </Link>
      </div>
    )
  }

  if (!product) notFound()

  const { content, plans, comparisonConfig } = product
  const billingEnabled = false

  const featuredPlanSlug =
    plans.find((p) => p.content?.badge === "most_popular")?.slug ??
    plans[Math.floor(plans.length / 2)]?.slug

  const isComingSoon = product.status === "COMING_SOON"

  return (
    <>
      {/* Product hero */}
      <section className="relative overflow-hidden bg-[#07070f] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-[130px]"
            style={{ animation: "glow-pulse 10s ease-in-out infinite" }}
          />
          <div
            className="absolute right-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[110px]"
            style={{ animation: "glow-pulse 13s ease-in-out infinite 1.5s" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/products"
            className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200"
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
              <p className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-lg font-medium text-transparent">
                {content.tagline}
              </p>
            )}

            {content?.valueProposition && (
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                {content.valueProposition}
              </p>
            )}

            {!isComingSoon && plans.length > 0 && (
              <div className="mt-8">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
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
        <section id="pricing" className="relative scroll-mt-16 bg-[#0a0a18] py-20 sm:py-28">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
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
              <div className="mx-auto mt-6 max-w-lg rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-center text-sm text-amber-300">
                Payments not yet live — all plans available by request during early access.
              </div>
            )}

            <div
              className={`mt-12 grid grid-cols-1 gap-5 ${
                plans.length === 2
                  ? "mx-auto max-w-2xl sm:grid-cols-2"
                  : plans.length === 3
                    ? "sm:grid-cols-3"
                    : "sm:grid-cols-2 lg:grid-cols-4"
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
        <section className="relative bg-[#07070f] py-20 sm:py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
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

      {/* Coming soon */}
      {isComingSoon && (
        <section className="relative bg-[#0a0a18] py-20 sm:py-28">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-sm font-semibold uppercase tracking-widest text-transparent">
              In development
            </p>
            <h2 className="mt-3 text-3xl font-bold text-white">
              {product.name} is coming soon
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              We&apos;re building it now. Contact us to get early access or be notified when it
              launches.
            </p>
            <div className="mt-8">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 via-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
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
          isComingSoon ? "Be the first to know" : `Ready to get started with ${product.name}?`
        }
        subheading={
          isComingSoon
            ? "Leave your details and we'll reach out when it's ready."
            : "Talk to us — we'll find the right plan for your team."
        }
        ctaPrimary={{ label: "Contact us", href: "/contact" }}
        ctaSecondary={!isComingSoon ? { label: "View all products", href: "/products" } : undefined}
      />
    </>
  )
}
