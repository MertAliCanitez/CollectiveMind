import type { Metadata } from "next"
import { SectionHeader } from "@/components/sections/section-header"
import { ProductCard, ProductCardSkeleton } from "@/components/sections/product-card"
import { CtaBand } from "@/components/sections/cta-band"
import { Badge } from "@/components/ui/badge"
import { getProductCatalog, getComingSoonProducts } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "Products",
  description:
    "The CollectiveMind suite — analytics, API integrations, and team collaboration for modern B2B teams.",
  openGraph: {
    title: "Products — CollectiveMind",
    description: "The CollectiveMind suite of B2B SaaS products.",
  },
}

export default async function ProductsPage() {
  const [catalog, comingSoon] = await Promise.all([getProductCatalog(), getComingSoonProducts()])

  const activeProducts = catalog?.products ?? []

  return (
    <>
      {/* Page hero */}
      <section className="relative bg-[#07070f] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]"
            style={{ animation: "glow-pulse 12s ease-in-out infinite" }}
          />
          <div
            className="absolute right-1/4 top-1/2 h-[300px] w-[300px] -translate-y-1/2 rounded-full bg-violet-600/10 blur-[100px]"
            style={{ animation: "glow-pulse 14s ease-in-out infinite 2s" }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The suite"
            heading="Everything your team needs to operate"
            subheading="Each product is powerful on its own. Together, they form a unified operating platform — with shared auth, billing, and team management baked in."
            align="left"
          />
        </div>
      </section>

      {/* Active products */}
      <section className="relative bg-[#07070f] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {activeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          )}
        </div>
      </section>

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <section className="relative bg-[#0a0a18] py-16 sm:py-20">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">On the roadmap</h2>
              <Badge variant="coming-soon">Coming soon</Badge>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Platform callout */}
      <section className="relative bg-[#07070f] py-16 sm:py-20">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-sm sm:p-12">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {[
                {
                  label: "Unified auth",
                  description:
                    "One login, one organization — access to every product you subscribe to. No more separate accounts.",
                },
                {
                  label: "Unified billing",
                  description:
                    "Manage all your subscriptions in one place. Upgrade, downgrade, or cancel without calling anyone.",
                },
                {
                  label: "Unified team management",
                  description:
                    "Invite your team once and set their access across all products. Role-based, audited, and easy.",
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-sm font-semibold uppercase tracking-widest text-transparent">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CtaBand
        heading="Not sure which product you need?"
        subheading="Talk to us. We'll help you figure out the right fit for your team."
        ctaPrimary={{ label: "Contact us", href: "/contact" }}
        ctaSecondary={{ label: "View pricing", href: "/pricing" }}
      />
    </>
  )
}
