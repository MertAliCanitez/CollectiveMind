# Skill: landing-page-conversion

## Purpose

Design and build high-converting marketing pages for `apps/web`. Applies conversion rate optimization (CRO) principles, copywriting frameworks, and Next.js rendering best practices to product pages, the homepage, and the pricing page.

## When to Use

Invoke this skill when:
- Building or redesigning the homepage
- Creating a product landing page (`/products/[slug]`)
- Designing the pricing page
- Adding a new section to an existing marketing page
- Evaluating whether a page structure is conversion-optimized

## Conversion Principles for B2B SaaS

**1. One job per page.** Every landing page has a primary CTA. All content supports that CTA. Secondary CTAs exist but are visually subordinate.

**2. Benefit-led, not feature-led.** Lead with the outcome the buyer gets. Describe the feature second. "Know exactly who's using what — and bill them for it" leads. "Usage tracking dashboard" follows.

**3. Specificity beats superlatives.** "Processes 10,000 records in under 3 seconds" beats "blazing fast". Real numbers, real outcomes.

**4. Remove friction before the CTA.** Every question unanswered in the visitor's mind is friction. Anticipate objections and answer them on the page.

**5. Trust before ask.** Social proof (logos, quotes, stats) should appear before the first conversion CTA when possible.

**6. B2B buyers are risk-averse.** Emphasize security, reliability, support, and ease of migration/cancellation.

## Page Structures

### Homepage Structure

```
1. HERO
   - Headline: primary value proposition (what outcome, for whom)
   - Subheadline: how it's delivered + key differentiator
   - Primary CTA: "Get started free" or "Start your trial"
   - Secondary CTA: "See how it works" (scrolls to demo/video)
   - Hero visual: product screenshot or illustration

2. SOCIAL PROOF BAR
   - 4-6 customer logos (use placeholder if none yet)
   - Or: key metric ("Used by X teams across Y countries")

3. PROBLEM STATEMENT
   - 2-3 sentences: the pain this platform solves
   - Resonates with the ICP; validates their frustration

4. PRODUCTS OVERVIEW
   - Grid/row of 2-3 products with: icon, name, one-liner, CTA to product page

5. HOW IT WORKS
   - 3-step process (numbered, visual) — keeps it simple

6. FEATURE HIGHLIGHTS
   - 3-4 benefit blocks: icon + heading + 2-sentence description
   - Not a feature dump — each block maps to a buyer concern

7. TESTIMONIAL / SOCIAL PROOF
   - 1-2 customer quotes with name, title, company
   - Include a metric if possible ("cut our billing setup from 3 weeks to 1 day")

8. PRICING TEASER
   - "Simple, transparent pricing" + link to pricing page
   - No full pricing table on homepage — it distracts

9. FINAL CTA SECTION
   - Repeat the primary CTA
   - Reduce residual anxiety: "No credit card required. Cancel anytime."

10. FOOTER
    - Navigation, legal links, social links
```

### Product Landing Page Structure

```
1. HERO
   - Product name + tagline
   - 1-2 sentence value prop specific to this product
   - Primary CTA: "Try [Product Name] free"
   - Product screenshot / demo video

2. THE PROBLEM (2-3 sentences)
   What does this product solve that nothing else does well?

3. CORE FEATURES (3-4 items)
   Each: icon + heading + 2-sentence description + optional screenshot

4. USE CASES
   "Perfect for [role/team] who need to [goal]"
   2-3 specific scenarios

5. HOW IT INTEGRATES
   Show how this product fits in the platform (shared account, same dashboard)

6. PRICING
   Show this product's plans (pulled from DB)
   Highlight the recommended plan

7. FAQ
   5-7 common questions: objections, pricing, security, support

8. CTA
   Repeat with risk-reducer copy
```

### Pricing Page Structure

```
1. HEADLINE: "Simple pricing for every team size"
2. BILLING TOGGLE: Monthly / Yearly (show savings %)
3. PLAN CARDS: 3 plans per product recommended
4. FEATURE COMPARISON TABLE: all features, all plans
5. FAQ: 6-8 common billing questions
6. ENTERPRISE CTA: "Need a custom plan? Talk to us."
```

## Step-by-Step Working Instructions

### 1. Define the ICP and CTA before writing

Answer before writing a single word:
- **Who is the ideal customer?** (role, company size, pain)
- **What is the one action we want them to take?**
- **What is their biggest objection?** (Where do they hesitate?)

These answers drive every headline, every CTA label, every trust element.

### 2. Write the headline first

The above-the-fold headline is the most important copy on the page. It must answer in 7 words or less:
- What does this do?
- For whom?
- What outcome?

Test multiple variants:
```
Variant A: "One platform. Every product your team needs."
Variant B: "B2B tools that grow with your organization."
Variant C: "Manage your team's software from one account."
```

Pick the most specific, benefit-oriented option.

### 3. Build the Next.js page with RSC

All marketing pages are Server Components. No client-side data fetching:

```tsx
// apps/web/app/(marketing)/products/[slug]/page.tsx
import { db } from "@repo/db"
import { notFound } from "next/navigation"
import { ProductHero } from "./_components/product-hero"
import { ProductPlans } from "./_components/product-plans"
import type { Metadata } from "next"

export async function generateMetadata({ params }): Promise<Metadata> {
  const product = await getProduct(params.slug)
  if (!product) return {}
  return {
    title: `${product.name} — CollectiveMind`,
    description: product.description,
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const [product, plans] = await Promise.all([
    getProduct(params.slug),
    getPublicPlans(params.slug),
  ])

  if (!product || product.status !== "ACTIVE") notFound()

  return (
    <>
      <ProductHero product={product} />
      <ProductFeatures product={product} />
      <ProductPlans plans={plans} />
      <ProductFaq productSlug={product.slug} />
      <ProductCTA product={product} />
    </>
  )
}
```

### 4. CTA button copy

Match the button label to the specific action and the user's state:

| Context | CTA label |
|---------|-----------|
| Homepage hero (no account) | "Get started free" |
| Product page (no account) | "Try [Product] free" |
| Pricing page (free plan) | "Start for free" |
| Pricing page (paid plan) | "Start free trial" |
| Pricing page (enterprise) | "Talk to us" |
| After sign-up (has account) | "Open dashboard" |
| For a feature on a higher plan | "Upgrade to Pro" |

Never use: "Sign up", "Register", "Buy now", "Click here"

### 5. Handle the empty social proof state

At launch, there are no real customers. Acceptable substitutes:
- Your own founding team quotes (first-person, honest)
- "Built for teams of 1 to 1,000" (aspiration, not claim)
- Feature-based trust signals: "SOC 2 in progress", "GDPR-ready", "99.9% uptime SLA"
- Leave the section out until you have real quotes — placeholder content damages credibility

## Project-Specific Conventions

### CTA destination

Primary CTAs on `apps/web` always point to the dashboard sign-up:

```tsx
<Link href={process.env.NEXT_PUBLIC_DASHBOARD_URL + "/sign-up"}>
  Get started free
</Link>
```

### Plan data on pricing page

Plans are fetched server-side from the database — not hardcoded:

```tsx
// Always filter: isPublic: true, status: "ACTIVE"
const plans = await db.plan.findMany({
  where: { productId: product.id, isPublic: true, status: "ACTIVE" },
  include: { features: true },
  orderBy: { sortOrder: "asc" },
})
```

### Highlighted plan

Each product has one plan marked as "recommended". Add a `isHighlighted` boolean to the `Plan` model post-MVP. At v1, the middle plan (Pro) is always visually highlighted in the UI.

### Section component naming

```
ProductHero       ← above fold, headline + CTA
ProductFeatures   ← 3-4 feature blocks
ProductUseCases   ← "perfect for" section
ProductPlans      ← pricing cards
ProductFaq        ← accordion FAQ
ProductCTA        ← bottom CTA section
```

Follow the same pattern for homepage sections:
```
HomeHero
HomeSocialProof
HomeProducts
HomeHowItWorks
HomeFeatures
HomeTestimonials
HomeCta
```
