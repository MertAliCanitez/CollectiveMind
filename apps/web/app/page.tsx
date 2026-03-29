import type { Metadata } from "next"
import Link from "next/link"
import { Hero } from "@/components/sections/hero"
import { TrustBar } from "@/components/sections/trust-bar"
import { FeatureHighlights } from "@/components/sections/feature-highlights"
import { SectionHeader } from "@/components/sections/section-header"
import { ProductCard, ProductCardSkeleton } from "@/components/sections/product-card"
import { CtaBand } from "@/components/sections/cta-band"
import { BarChart, Globe, Shield, Layers, Users, Zap } from "@/components/ui/icons"
import { getProductCatalog } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "CollectiveMind — The operating stack for modern B2B teams",
  description:
    "Analytics, API integrations, and team collaboration — unified under one platform. Built for modern B2B teams.",
  openGraph: {
    title: "CollectiveMind — The operating stack for modern B2B teams",
    description:
      "Analytics, API integrations, and team collaboration — unified under one platform.",
  },
}

const platformFeatures = [
  {
    icon: <Layers size={20} />,
    title: "One platform, every tool",
    description:
      "Stop managing five different vendors. CollectiveMind brings analytics, integrations, and collaboration into a single, coherent platform.",
  },
  {
    icon: <Shield size={20} />,
    title: "Enterprise-grade security",
    description:
      "SSO, SAML, role-based access control, and audit logs — built in from day one, not bolted on as an afterthought.",
  },
  {
    icon: <Users size={20} />,
    title: "Team-first design",
    description:
      "Granular permissions, organization-level billing, and shared contexts make it easy for every member of your team to do their best work.",
  },
  {
    icon: <Zap size={20} />,
    title: "Fast by default",
    description:
      "No bloated dashboards. No slow load times. Every product is engineered for speed so your team spends time acting on data, not waiting for it.",
  },
  {
    icon: <Globe size={20} />,
    title: "Works with your stack",
    description:
      "Open APIs, webhook support, and native integrations with the tools you already use. No rip-and-replace required.",
  },
  {
    icon: <BarChart size={20} />,
    title: "Built to scale with you",
    description:
      "Start with a free plan and grow into enterprise without re-evaluating vendors. Pricing and features designed to grow with your team.",
  },
]

export default async function HomePage() {
  const catalog = await getProductCatalog()
  const activeProducts = catalog?.products ?? []

  return (
    <>
      <Hero
        dark
        eyebrow="Now in early access"
        headline="The operating stack for modern B2B teams"
        subheadline="Analytics, API integrations, and team collaboration — unified under one roof. Stop duct-taping your tools together."
        ctaPrimary={{ label: "Explore products", href: "/products" }}
        ctaSecondary={{ label: "Request a demo", href: "/contact" }}
      />

      <TrustBar />

      {/* Products section */}
      <section className="relative bg-[#0a0a18] py-24 sm:py-32">
        {/* Subtle top separator */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="The suite"
            heading="Every tool your team needs"
            subheading="Three products built to work together. Use one, use all — they share the same auth, billing, and team management layer."
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeProducts.length > 0 ? (
              activeProducts.map((product) => <ProductCard key={product.id} product={product} />)
            ) : (
              <>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </>
            )}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
            >
              View all products and pricing →
            </Link>
          </div>
        </div>
      </section>

      <FeatureHighlights
        eyebrow="Why CollectiveMind"
        heading="Built for teams who move fast"
        subheading="We didn't build another tool. We built the connective tissue that makes your entire stack more powerful."
        features={platformFeatures}
        background="slate"
      />

      <CtaBand
        heading="Ready to see it in action?"
        subheading="Request access and our team will set you up with a personalized demo."
        ctaPrimary={{ label: "Request access", href: "/contact" }}
        ctaSecondary={{ label: "View pricing", href: "/pricing" }}
      />
    </>
  )
}
