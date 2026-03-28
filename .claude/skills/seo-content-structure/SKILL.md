# Skill: seo-content-structure

## Purpose

Structure public-facing pages in `apps/web` for search engine discoverability using Next.js's Metadata API, structured data (JSON-LD), and content hierarchy best practices. Targets organic search as a growth channel for B2B SaaS acquisition.

## When to Use

Invoke this skill when:
- Adding a new public route to `apps/web`
- Writing metadata for a product or pricing page
- Adding structured data (organization, product, FAQ, breadcrumbs)
- Setting up the sitemap or robots.txt
- Reviewing a page for SEO completeness before launch
- Writing heading structure or content hierarchy for a landing page

## Rules and Guardrails

**Use Next.js Metadata API only.** Never use `<head>` tags directly in page components. Never use `next/head` — it's the Pages Router API. App Router uses `export const metadata` or `generateMetadata()`.

**One H1 per page.** The page title is the H1. All other headings follow a strict hierarchy (H2 → H3 → H4). Never skip levels.

**Title format:** `[Page name] — [Brand name]`. Max 60 characters. The brand name is always "CollectiveMind" in production.

**Description:** 140–160 characters. Describes the specific page content and includes the primary keyword. Not a generic brand tagline.

**Canonical URLs:** Always set for pages that could be accessed via multiple URLs (e.g., with/without trailing slash, with/without `?tab=` params).

**No keyword stuffing.** Write for humans. Google's algorithm penalizes keyword-dense, unnatural copy. Semantic relevance over keyword density.

## Step-by-Step Working Instructions

### 1. Set static metadata on a page

```tsx
// apps/web/app/(marketing)/products/page.tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products — CollectiveMind",
  description: "Discover the suite of B2B tools built to help your team move faster. One account, one dashboard, multiple powerful products.",
  openGraph: {
    title: "Products — CollectiveMind",
    description: "B2B tools for modern teams, unified under one platform.",
    type: "website",
    url: "https://collectivemind.com/products",
    images: [
      {
        url: "/og/products.png",   // 1200x630px
        width: 1200,
        height: 630,
        alt: "CollectiveMind Products",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Products — CollectiveMind",
    description: "B2B tools for modern teams, unified under one platform.",
    images: ["/og/products.png"],
  },
}
```

### 2. Set dynamic metadata for product pages

```tsx
// apps/web/app/(marketing)/products/[slug]/page.tsx
import type { Metadata } from "next"
import { db } from "@repo/db"

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await db.product.findUnique({
    where: { slug: params.slug, status: "ACTIVE" },
  })

  if (!product) {
    return { title: "Product Not Found — CollectiveMind" }
  }

  const title = `${product.name} — CollectiveMind`
  const description = product.description ?? `${product.name} by CollectiveMind. Built for B2B teams.`
  const url = `https://collectivemind.com/products/${product.slug}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: [
        {
          url: `/og/products/${product.slug}.png`,
          width: 1200,
          height: 630,
          alt: `${product.name} by CollectiveMind`,
        }
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}
```

### 3. Root layout metadata (default / fallback)

```tsx
// apps/web/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://collectivemind.com"),
  title: {
    default: "CollectiveMind — B2B SaaS Platform",
    template: "%s — CollectiveMind",  // child pages use this template
  },
  description: "One platform for every product your B2B team needs. Unified auth, billing, and access management.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

### 4. Add JSON-LD structured data

Structured data helps Google understand page content and enables rich results (FAQ snippets, breadcrumbs, etc.).

**Organization schema (root layout or homepage):**

```tsx
// apps/web/app/(marketing)/page.tsx
export default function HomePage() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CollectiveMind",
    url: "https://collectivemind.com",
    logo: "https://collectivemind.com/logo.png",
    sameAs: [
      "https://twitter.com/collectivemind",
      "https://linkedin.com/company/collectivemind",
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {/* page content */}
    </>
  )
}
```

**FAQ schema (product pages with FAQ section):**

```tsx
function FaqStructuredData({ faqs }: { faqs: { q: string; a: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: {
        "@type": "Answer",
        text: a,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

**Breadcrumb schema:**

```tsx
function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
```

### 5. Sitemap

```tsx
// apps/web/app/sitemap.ts
import type { MetadataRoute } from "next"
import { db } from "@repo/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true, updatedAt: true },
  })

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://collectivemind.com", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://collectivemind.com/products", lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: "https://collectivemind.com/pricing", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: "https://collectivemind.com/about", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `https://collectivemind.com/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }))

  return [...staticRoutes, ...productRoutes]
}
```

### 6. Robots.txt

```tsx
// apps/web/app/robots.ts
import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/"],
      },
    ],
    sitemap: "https://collectivemind.com/sitemap.xml",
  }
}
```

## Project-Specific Conventions

### OG Image Strategy

Static OG images live in `apps/web/public/og/`. For product pages, generate them programmatically using Next.js `ImageResponse` (post-MVP) or use static per-product images initially.

File naming: `/og/[page-slug].png` — all 1200×630px.

### Page title hierarchy

| Page | Title |
|------|-------|
| Homepage | `CollectiveMind — B2B SaaS Platform` |
| Products listing | `Products — CollectiveMind` |
| Product page | `[Product Name] — CollectiveMind` |
| Pricing | `Pricing — CollectiveMind` |
| Blog post | `[Post Title] — CollectiveMind Blog` |
| Legal pages | `Privacy Policy — CollectiveMind` |

### Keyword targets per page

| Page | Primary keyword target |
|------|----------------------|
| Homepage | "B2B SaaS platform" / brand |
| Product A page | Product A specific problem/category |
| Pricing | "[Product] pricing" / "[Product] plans" |
| Blog posts | Long-tail search intent per post |

Keywords are incorporated naturally into headings and first paragraphs — never forced.

### What NOT to index

Add `noindex` to:
- Auth pages (`/sign-in`, `/sign-up`)
- Dashboard routes (`/dashboard/*`)
- Admin routes (`/admin/*` — also not on main domain)
- Any page with `?` query parameters that produces duplicate content

```tsx
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}
```
