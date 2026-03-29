import type { Metadata } from "next"
import Link from "next/link"
import { SectionHeader } from "@/components/sections/section-header"
import { PlanCard } from "@/components/sections/plan-card"
import { CtaBand } from "@/components/sections/cta-band"
import { getProductCatalog } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for every product in the CollectiveMind suite. Free plans available. No hidden fees.",
  openGraph: {
    title: "Pricing — CollectiveMind",
    description: "Simple, transparent pricing. Free plans available.",
  },
}

const faq = [
  {
    q: "Is there a free plan?",
    a: "Yes. Both Insights and Connect offer free plans with no credit card required. You can upgrade at any time.",
  },
  {
    q: "How does billing work?",
    a: "Plans are billed monthly or annually. Annual plans are billed upfront and offer the best per-month rate. You can cancel at any time.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade or downgrade your plan at any time from the billing settings in your dashboard. Changes take effect immediately.",
  },
  {
    q: "What happens when payments go live?",
    a: "We're in early access. During this period, all access is managed directly by our team. When payments go live, you'll be notified and can choose a plan through self-serve checkout.",
  },
  {
    q: "Do you offer enterprise pricing?",
    a: "Yes. Enterprise plans include custom limits, dedicated infrastructure, SLA guarantees, and priority support. Contact us for a custom quote.",
  },
  {
    q: "Is there a discount for annual billing?",
    a: "Enterprise plans are billed annually and offer significant savings compared to monthly pricing. Contact us for details.",
  },
]

export default async function PricingPage() {
  const catalog = await getProductCatalog()
  const products = catalog?.products ?? []
  const billingEnabled = catalog?.billing.isLive ?? false

  return (
    <>
      {/* Header */}
      <section className="relative bg-[#07070f] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[130px]"
            style={{ animation: "glow-pulse 12s ease-in-out infinite" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Pricing"
            heading="Simple, transparent pricing"
            subheading="Free plans to start. Upgrade when you need more. No hidden fees, no surprise invoices."
          />
          {!billingEnabled && (
            <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Payments coming soon — contact us for early access to any plan
            </div>
          )}
        </div>
      </section>

      {/* Plans per product */}
      {products.length > 0 ? (
        products.map((product, idx) => (
          <section
            key={product.id}
            className={`relative py-16 sm:py-20 ${idx % 2 === 0 ? "bg-[#07070f]" : "bg-[#0a0a18]"}`}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{product.name}</h2>
                  {product.content?.tagline && (
                    <p className="mt-1 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-sm font-medium text-transparent">
                      {product.content.tagline}
                    </p>
                  )}
                </div>
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
                >
                  Learn more →
                </Link>
              </div>

              {product.plans.length > 0 ? (
                <div
                  className={`grid grid-cols-1 gap-5 ${
                    product.plans.length === 2
                      ? "max-w-2xl sm:grid-cols-2"
                      : product.plans.length === 3
                        ? "sm:grid-cols-3"
                        : "sm:grid-cols-2 lg:grid-cols-4"
                  }`}
                >
                  {product.plans.map((plan) => {
                    const isFeatured = plan.content?.badge === "most_popular"
                    return (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        billingEnabled={billingEnabled}
                        featured={isFeatured}
                      />
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Plans coming soon.</p>
              )}
            </div>
          </section>
        ))
      ) : (
        <section className="relative bg-[#07070f] py-24">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="mx-auto max-w-md px-4 text-center">
            <p className="text-slate-400">Pricing information is not available right now.</p>
            <Link
              href="/contact"
              className="mt-4 inline-block text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              Contact us for pricing →
            </Link>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="relative bg-[#0a0a18] py-20 sm:py-28">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute right-1/4 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-blue-600/8 blur-[100px]"
            style={{ animation: "glow-pulse 16s ease-in-out infinite" }}
          />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="FAQ" heading="Pricing questions answered" />
          <div className="mt-10 divide-y divide-white/[0.06]">
            {faq.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white marker:hidden">
                  {item.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-transform group-open:rotate-180">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        heading="Have a question not covered here?"
        subheading="Our team is happy to walk you through pricing and help you find the right plan."
        ctaPrimary={{ label: "Talk to us", href: "/contact" }}
      />
    </>
  )
}
