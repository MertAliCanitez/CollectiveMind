/**
 * Admin data layer — Plans and Prices.
 *
 * No business logic here. Pure DB queries and mutations.
 * Auth is enforced by the calling page/action via requirePlatformAdmin().
 */
import { db, type Plan, type Price, type BillingInterval, type PlanStatus } from "@repo/database"

export interface AdminPlan {
  id: string
  productId: string
  name: string
  slug: string
  description: string | null
  billingInterval: BillingInterval
  displayPrice: number
  currency: string
  isPublic: boolean
  status: PlanStatus
  sortOrder: number
  featureCount: number
  priceCount: number
  createdAt: Date
}

export async function listPlansForProduct(productId: string): Promise<AdminPlan[]> {
  const plans = await db.plan.findMany({
    where: { productId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      _count: { select: { features: true, prices: true } },
    },
  })

  return plans.map((p) => ({
    id: p.id,
    productId: p.productId,
    name: p.name,
    slug: p.slug,
    description: p.description,
    billingInterval: p.billingInterval,
    displayPrice: p.displayPrice,
    currency: p.currency,
    isPublic: p.isPublic,
    status: p.status,
    sortOrder: p.sortOrder,
    featureCount: p._count.features,
    priceCount: p._count.prices,
    createdAt: p.createdAt,
  }))
}

export interface AdminPlanDetail extends Plan {
  features: { id: string; key: string; value: string }[]
}

export async function getPlan(id: string): Promise<AdminPlanDetail | null> {
  return db.plan.findUnique({
    where: { id },
    include: { features: true },
  })
}

export interface CreatePlanInput {
  productId: string
  name: string
  slug: string
  description?: string
  billingInterval: BillingInterval
  displayPrice: number
  currency?: string
  isPublic?: boolean
  status?: PlanStatus
  sortOrder?: number
}

export async function createPlan(data: CreatePlanInput): Promise<Plan> {
  return db.plan.create({
    data: {
      productId: data.productId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      billingInterval: data.billingInterval,
      displayPrice: data.displayPrice,
      currency: data.currency ?? "USD",
      isPublic: data.isPublic ?? true,
      status: data.status ?? "ACTIVE",
      sortOrder: data.sortOrder ?? 0,
    },
  })
}

export interface UpdatePlanInput {
  name?: string
  description?: string | null
  billingInterval?: BillingInterval
  displayPrice?: number
  isPublic?: boolean
  status?: PlanStatus
  sortOrder?: number
}

export async function updatePlan(id: string, data: UpdatePlanInput): Promise<Plan> {
  return db.plan.update({ where: { id }, data })
}

// ─── Prices ──────────────────────────────────────────────────────────────────

export async function listPricesForPlan(planId: string): Promise<Price[]> {
  return db.price.findMany({
    where: { planId },
    orderBy: { createdAt: "asc" },
  })
}

export interface CreatePriceInput {
  planId: string
  nickname?: string
  currency?: string
  unitAmount: number
  billingInterval: BillingInterval
  providerPriceId?: string
}

export async function createPrice(data: CreatePriceInput): Promise<Price> {
  return db.price.create({
    data: {
      planId: data.planId,
      nickname: data.nickname ?? null,
      currency: data.currency ?? "USD",
      unitAmount: data.unitAmount,
      billingInterval: data.billingInterval,
      providerPriceId: data.providerPriceId ?? null,
      isActive: true,
    },
  })
}

export async function updatePrice(
  id: string,
  data: { nickname?: string; isActive?: boolean; providerPriceId?: string | null },
): Promise<Price> {
  return db.price.update({ where: { id }, data })
}

// ─── Plan Features ────────────────────────────────────────────────────────────

export async function upsertPlanFeature(planId: string, key: string, value: string) {
  return db.planFeature.upsert({
    where: { planId_key: { planId, key } },
    update: { value },
    create: { planId, key, value },
  })
}

export async function deletePlanFeature(planId: string, key: string) {
  return db.planFeature.deleteMany({ where: { planId, key } })
}
