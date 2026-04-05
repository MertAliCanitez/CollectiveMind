"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { db } from "@repo/database"
import { createSubscription, cancelSubscription } from "@repo/billing"
import { requirePlatformAdmin } from "../../../../../lib/auth"
import { resolveDbUserId, writeAdminAuditLog } from "../../../../../lib/admin/audit"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSubscriptionSchema = z.object({
  planId: z.string().min(1, "Plan selection is required"),
  trialDays: z.coerce
    .number()
    .int()
    .min(0)
    .max(90)
    .optional()
    .transform((v) => (v === 0 ? undefined : v)),
  notes: z.string().max(500).optional().transform((v) => v || undefined),
})

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSubscriptionAction(
  orgId: string,
  formData: FormData,
): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()
  const actorDbUserId = await resolveDbUserId(clerkUserId)

  const raw = {
    planId: formData.get("planId"),
    trialDays: formData.get("trialDays") || undefined,
    notes: formData.get("notes") || undefined,
  }

  const parsed = createSubscriptionSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/organizations/${orgId}?subError=${encodeURIComponent(msg)}`)
  }

  // Resolve the product for the selected plan
  const plan = await db.plan.findUnique({
    where: { id: parsed.data.planId },
    select: { id: true, slug: true, productId: true, product: { select: { slug: true } } },
  })
  if (!plan) {
    redirect(
      `/admin/organizations/${orgId}?subError=${encodeURIComponent("Selected plan not found.")}`,
    )
  }

  // Duplicate guard — reject if org already has an ACTIVE or TRIALING subscription
  // for any plan belonging to this product.
  const existing = await db.subscription.findFirst({
    where: {
      organizationId: orgId,
      status: { in: ["ACTIVE", "TRIALING"] },
      plan: { productId: plan.productId },
    },
    select: { id: true },
  })
  if (existing) {
    redirect(
      `/admin/organizations/${orgId}?subError=${encodeURIComponent(
        "This org already has an active or trialing subscription for that product. Cancel it first.",
      )}`,
    )
  }

  try {
    const subscription = await createSubscription(
      {
        organizationId: orgId,
        planId: parsed.data.planId,
        trialDays: parsed.data.trialDays,
        notes: parsed.data.notes,
      },
      actorDbUserId ?? undefined,
    )

    await writeAdminAuditLog({
      actorDbUserId,
      action: "subscription.created",
      resourceType: "Subscription",
      resourceId: subscription.id,
      organizationId: orgId,
      metadata: {
        planSlug: plan.slug,
        productSlug: plan.product.slug,
        trialDays: parsed.data.trialDays ?? null,
      },
    })
  } catch {
    redirect(
      `/admin/organizations/${orgId}?subError=${encodeURIComponent("Failed to create subscription.")}`,
    )
  }

  redirect(`/admin/organizations/${orgId}`)
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelSubscriptionAction(
  orgId: string,
  subscriptionId: string,
): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()
  const actorDbUserId = await resolveDbUserId(clerkUserId)

  // Verify the subscription belongs to this org before canceling
  const subscription = await db.subscription.findFirst({
    where: { id: subscriptionId, organizationId: orgId },
    select: { id: true, plan: { select: { slug: true, product: { select: { slug: true } } } } },
  })
  if (!subscription) {
    redirect(
      `/admin/organizations/${orgId}?subError=${encodeURIComponent("Subscription not found.")}`,
    )
  }

  try {
    await cancelSubscription(
      { subscriptionId, atPeriodEnd: false, reason: "Canceled by platform admin" },
      actorDbUserId ?? undefined,
    )

    await writeAdminAuditLog({
      actorDbUserId,
      action: "subscription.canceled",
      resourceType: "Subscription",
      resourceId: subscriptionId,
      organizationId: orgId,
      metadata: {
        planSlug: subscription.plan.slug,
        productSlug: subscription.plan.product.slug,
        immediate: true,
      },
    })
  } catch {
    redirect(
      `/admin/organizations/${orgId}?subError=${encodeURIComponent("Failed to cancel subscription.")}`,
    )
  }

  redirect(`/admin/organizations/${orgId}`)
}
