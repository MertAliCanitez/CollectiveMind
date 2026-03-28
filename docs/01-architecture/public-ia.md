# Public Website — Information Architecture

This document maps the page structure, component hierarchy, data dependencies, and design decisions for `apps/web` — the CollectiveMind public marketing site.

For content conventions (products, plans, feature keys), see `docs/04-runbooks/catalog-content.md`.

---

## URL Structure

```
/                               Homepage
/products                       Products listing
/products/[slug]                Product detail (dynamic, driven by DB slug)
/pricing                        Pricing overview (all products)
/contact                        Contact / request access
/legal                          Legal document index
/legal/privacy                  Privacy policy
/legal/terms                    Terms of service
/legal/cookies                  Cookie policy
```

### SEO priority

| Priority | Pages                            |
| -------- | -------------------------------- |
| 1.0      | `/`                              |
| 0.9      | `/products`, `/pricing`          |
| 0.85     | `/products/[slug]` (per product) |
| 0.7      | `/contact`                       |
| 0.3      | `/legal/*`                       |

The sitemap (`app/sitemap.ts`) fetches product slugs from the catalog at build/request time and includes them dynamically.

---

## Page Map

### `/` — Homepage

**Purpose:** Acquisition — introduce the platform and drive to products or contact.

**Sections (in order):**

1. `Hero` — dark, headline + 2 CTAs ("Explore products", "Request a demo")
2. `TrustBar` — social proof / customer logos row
3. Products grid — `ProductCard` for each active product
4. `FeatureHighlights` — 6-column platform benefits (auth, security, team, speed, integrations, scale)
5. `CtaBand` — "Request access" conversion strip

**Data:** `getProductCatalog()` — products grid. Degrades to skeleton cards if DB unavailable.

**Metadata:**

```
title: "CollectiveMind — The operating stack for modern B2B teams"
description: "Analytics, API integrations, and team collaboration — unified..."
```

---

### `/products` — Products listing

**Purpose:** Discovery — show all products with value propositions, help users find the right fit.

**Sections:**

1. Page header with `SectionHeader` (left-aligned)
2. Active products grid — `ProductCard` per product
3. Coming soon section — `ProductCard` with COMING_SOON badge
4. Platform callout — 3-column unified auth/billing/team management
5. `CtaBand`

**Data:** `getProductCatalog()` + `getComingSoonProducts()`

---

### `/products/[slug]` — Product detail

**Purpose:** Conversion — deep dive into a single product, show plans, drive to contact/checkout.

**Sections:**

1. Dark hero — product name, tagline, value proposition, CTA
2. Plans grid — `PlanCard` per plan (featured plan highlighted)
3. Comparison table — `ComparisonTable` (hidden if no `comparisonConfig`)
4. Coming soon state (shown instead of plans when `status === "COMING_SOON"`)
5. `CtaBand`

**Data:** `getCatalogProduct(slug)` — single product with plans + comparison config.

**Special states:**

- DB unavailable → "not available right now" message (not 404)
- Product not found → `notFound()` → Next.js 404 page
- Coming soon → alternate hero + no plans section

**Metadata:** Dynamically generated from `product.name` + `product.content.tagline`

---

### `/pricing` — Pricing overview

**Purpose:** Conversion — all products' plans in one place, answer pricing objections.

**Sections:**

1. Page header with billing-not-live notice when applicable
2. Per-product plan sections (one per active product)
3. FAQ accordion (`<details>` / `<summary>`, zero-JS)
4. `CtaBand`

**Data:** `getProductCatalog()` — all products with plans + `billing.isLive` flag.

**Billing-not-live state:** Banner explains payments are coming soon, all plans available on request. Plan card CTAs show "Contact us" instead of checkout buttons.

---

### `/contact` — Contact / request access

**Purpose:** Lead capture — request access, demo, or general inquiry.

**Sections:**

1. Left column — headline, trust points (fast response, human, no pressure), early access note
2. Right column — `ContactForm` (client component)

**Data:** Static — no DB calls.

**Form fields:** Name, Work email, Company, Role, Product interest (multi-select), Message.

**Form state:** Client-side controlled. On submit, shows success state.
Form submission is not wired to a backend yet — see `components/contact-form.tsx` for the TODO.

---

### `/legal` — Legal index

**Purpose:** Navigation hub for legal documents.

Lists links to Privacy, Terms, Cookies pages.

---

### `/legal/privacy`, `/legal/terms`, `/legal/cookies` — Legal documents

**Purpose:** Compliance — required disclosures.

All three are structural **placeholders** with clearly labeled "Placeholder document" banners. They must be replaced with reviewed legal copy before public launch. See each file for section structure.

---

## Component Map

```
apps/web/
├── components/
│   ├── ui/
│   │   ├── button.tsx          Button (variants: default, outline, ghost, secondary, link)
│   │   ├── badge.tsx           Badge (variants: default, secondary, outline, success, coming-soon, enterprise, popular)
│   │   └── icons.tsx           Inline SVG icons (no runtime dependency)
│   ├── layout/
│   │   ├── site-nav.tsx        [client] Sticky top nav, mobile hamburger menu
│   │   └── site-footer.tsx     Multi-column footer with link sections
│   ├── sections/
│   │   ├── hero.tsx            Page hero (light or dark variant)
│   │   ├── trust-bar.tsx       Social proof / logos bar
│   │   ├── product-card.tsx    Product card + ProductCardSkeleton (loading state)
│   │   ├── plan-card.tsx       Pricing plan card (featured variant + billing-not-live state)
│   │   ├── comparison-table.tsx Feature comparison table (responsive, scrollable)
│   │   ├── cta-band.tsx        Full-width dark conversion strip
│   │   ├── feature-highlights.tsx 3-column icon + text grid
│   │   └── section-header.tsx  Reusable eyebrow + h2 + subheading block
│   └── contact-form.tsx        [client] Contact form with product interest chips
├── lib/
│   └── catalog.ts              Safe wrappers for @repo/billing catalog functions (try/catch)
└── app/
    ├── layout.tsx              Root layout — SiteNav + main + SiteFooter
    ├── page.tsx                Homepage
    ├── not-found.tsx           Custom 404
    ├── sitemap.ts              Dynamic sitemap including product routes
    ├── robots.ts               robots.txt
    ├── products/
    │   ├── page.tsx            Products listing
    │   └── [slug]/page.tsx     Product detail (dynamic)
    ├── pricing/page.tsx        Pricing overview
    ├── contact/page.tsx        Contact page
    └── legal/
        ├── page.tsx            Legal index
        ├── privacy/page.tsx    Privacy policy placeholder
        ├── terms/page.tsx      Terms of service placeholder
        └── cookies/page.tsx    Cookie policy placeholder
```

---

## Data Flow

```
@repo/billing
  getProductCatalog()      → homepage, /products, /pricing
  getCatalogProduct(slug)  → /products/[slug]
  getComingSoonProducts()  → /products
          │
          ▼
  apps/web/lib/catalog.ts  (safe wrappers, returns null on DB error)
          │
          ▼
  Server Components (page.tsx files)
          │
          ▼
  Props → Section components (pure, no data fetching)
          │
          ├── Client components (SiteNav, ContactForm — need interactivity)
          └── Server components (everything else — default)
```

---

## Design System

### Color palette

| Use            | Value                                    |
| -------------- | ---------------------------------------- |
| Primary CTA    | `indigo-600` / `indigo-700` (hover)      |
| Dark hero bg   | `slate-950` → `slate-900` gradient       |
| Dark CTA band  | `slate-900` → `indigo-950` gradient      |
| Section alt bg | `slate-50`                               |
| Body text      | `slate-600`                              |
| Muted text     | `slate-400` / `slate-500`                |
| Headings       | `slate-900`                              |
| Borders        | `slate-200` / `slate-100`                |
| Eyebrow labels | `indigo-600`, uppercase, tracking-widest |

CSS variables from `packages/ui/src/globals.css` are inherited but the marketing site primarily uses Tailwind palette classes directly rather than CSS variable tokens, for clarity.

### Typography

- Font: Inter (loaded via `next/font/google`)
- Display headings: `font-bold tracking-tight`
- Hero: `text-5xl sm:text-6xl lg:text-7xl`
- Section headings: `text-3xl sm:text-4xl`
- Body: `text-sm` to `text-lg`, `leading-relaxed`
- Eyebrows: `text-sm font-semibold uppercase tracking-widest`

### Component conventions

- **Rounded corners:** `rounded-lg` (buttons), `rounded-xl` (cards, inputs), `rounded-2xl` (large cards, sections)
- **Shadows:** `shadow-sm` for cards, `shadow-xl` for featured plans
- **Spacing:** `py-24 sm:py-32` for major sections, `max-w-7xl mx-auto` container
- **CTA hierarchy:** Primary (indigo filled) > Secondary (slate outlined) > Link (indigo text)

---

## Billing-Not-Live Display Mode

When `catalog.billing.isLive === false` (i.e., `PAYMENT_PROVIDER` env var is not set or set to `"null"`):

- Pricing page header shows an amber notice: "Payments coming soon — contact us for early access"
- `PlanCard` replaces checkout CTAs with "Contact us" or "Request free access"
- A sub-notice appears under paid plan prices: "Payments coming soon — contact us for access"
- Product detail page shows the same amber notice above the plans grid

This means the full pricing/plans UI is always visible — it communicates value even before payments are live.

---

## Pre-Launch Checklist

These items need to be completed before publicly launching the marketing site:

- [ ] Replace placeholder legal documents (`/legal/privacy`, `/legal/terms`, `/legal/cookies`) with reviewed copy
- [ ] Replace `TrustBar` company name placeholders with real customer logos
- [ ] Wire `ContactForm` to a real submission endpoint (Resend, Formspark, or a Next.js server action)
- [ ] Set `NEXT_PUBLIC_APP_URL` in production environment
- [ ] Add real `favicon.ico` and OG image to `public/`
- [ ] Add `openGraph.images` to root `layout.tsx` metadata once OG image is created
- [ ] Verify the dashboard sign-in URL in `site-nav.tsx` (`href` currently set to example domain)

---

## Adding New Pages

1. Create `app/[route]/page.tsx`
2. Export `metadata` for SEO
3. Use `SectionHeader` for consistent heading structure
4. Add the route to `app/sitemap.ts`
5. Add footer link if appropriate (`components/layout/site-footer.tsx`)
6. Document here under "Page Map"
