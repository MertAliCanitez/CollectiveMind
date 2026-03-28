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
      {/* Page header */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The suite"
            heading="Everything your team needs to operate"
            subheading="Each product is powerful on its own. Together, they form a unified operating platform — with shared auth, billing, and team management baked in."
            align="left"
          />
        </div>
      </section>

      {/* Active products */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <ProductCardSkeleton />
              <ProductCardSkeleton />
            </div>
          )}
        </div>
      </section>

      {/* Coming soon */}
      {comingSoon.length > 0 && (
        <section className="border-t border-slate-100 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">On the roadmap</h2>
              <Badge variant="coming-soon">Coming soon</Badge>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Platform callout */}
      <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-slate-50 p-8 sm:p-12">
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
                  <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
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
