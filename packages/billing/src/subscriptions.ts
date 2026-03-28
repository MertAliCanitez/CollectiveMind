/**
 * Subscription state machine and CRUD operations.
 * All subscription mutations go through these functions — never direct Prisma calls from routes.
 */
import { db } from "@repo/database"
import { logger } from "@repo/shared"
import type { SubscriptionStatus } from "@repo/database"
import type { CreateSubscriptionInput, CancelSubscriptionInput } from "@repo/shared"

function calculatePeriodEnd(billingInterval: string, from: Date): Date {
  const end = new Date(from)
  switch (billingInterval) {
    case "MONTH":
      end.setMonth(end.getMonth() + 1)
      break
    case "YEAR":
      end.setFullYear(end.getFullYear() + 1)
      break
    case "FREE":
      end.setFullYear(end.getFullYear() + 100) // effectively permanent
      break
    case "ONE_TIME":
      end.setFullYear(end.getFullYear() + 100)
      break
  }
  return end
}

export async function createSubscription(
  input: CreateSubscriptionInput,
  actorUserId?: string,
) {
  const plan = await db.plan.findUniqueOrThrow({
    where: { id: input.planId },
    include: { product: { select: { slug: true } } },
  })

  const now = new Date()
  const periodEnd = calculatePeriodEnd(plan.billingInterval, now)
  const trialEndsAt = input.trialDays
    ? new Date(now.getTime() + input.trialDays * 24 * 60 * 60 * 1000)
    : null

  const status: SubscriptionStatus = input.trialDays ? "TRIALING" : "ACTIVE"

  const subscription = await db.subscription.create({
    data: {
      organizationId: input.organizationId,
      planId: input.planId,
      status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      trialEndsAt,
      notes: input.notes,
    },
  })

  await db.auditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      actorType: actorUserId ? "USER" : "SYSTEM",
      organizationId: input.organizationId,
      action: "subscription.created",
      resourceType: "Subscription",
      resourceId: subscription.id,
      metadata: {
        planSlug: plan.slug,
        productSlug: plan.product.slug,
        status,
        trialDays: input.trialDays ?? null,
      },
    },
  })

  logger.info("subscription.created", {
    orgId: input.organizationId,
    planId: input.planId,
    status,
  })

  return subscription
}

export async function cancelSubscription(
  input: CancelSubscriptionInput,
  actorUserId?: string,
) {
  const subscription = await db.subscription.findUniqueOrThrow({
    where: { id: input.subscriptionId },
    include: { plan: { include: { product: { select: { slug: true } } } } },
  })

  const updated = await db.subscription.update({
    where: { id: input.subscriptionId },
    data: input.atPeriodEnd
      ? { cancelAtPeriodEnd: true }
      : { status: "CANCELED", canceledAt: new Date() },
  })

  await db.auditLog.create({
    data: {
      actorUserId: actorUserId ?? null,
      actorType: actorUserId ? "ADMIN" : "SYSTEM",
      organizationId: subscription.organizationId,
      action: "subscription.canceled",
      resourceType: "Subscription",
      resourceId: input.subscriptionId,
      metadata: {
        planSlug: subscription.plan.slug,
        productSlug: subscription.plan.product.slug,
        atPeriodEnd: input.atPeriodEnd,
        reason: input.reason,
      },
    },
  })

  logger.info("subscription.canceled", {
    orgId: subscription.organizationId,
    subscriptionId: input.subscriptionId,
    atPeriodEnd: input.atPeriodEnd,
  })

  return updated
}
