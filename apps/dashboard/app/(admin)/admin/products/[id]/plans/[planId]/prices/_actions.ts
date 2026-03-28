"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { requirePlatformAdmin } from "../../../../../../../../lib/auth"
import { createPrice, updatePrice } from "../../../../../../../../lib/admin/plans"
import { resolveDbUserId, writeAdminAuditLog } from "../../../../../../../../lib/admin/audit"

const priceSchema = z.object({
  nickname: z.string().max(128).optional(),
  currency: z.string().length(3).default("USD"),
  unitAmount: z.coerce.number().int("Unit amount must be whole cents").min(0),
  billingInterval: z.enum(["FREE", "MONTH", "YEAR", "ONE_TIME"]),
  providerPriceId: z.string().max(128).optional(),
})

export async function createPriceAction(
  productId: string,
  planId: string,
  formData: FormData,
): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()
  const actorDbUserId = await resolveDbUserId(clerkUserId)

  const raw = {
    nickname: formData.get("nickname") || undefined,
    currency: formData.get("currency") || "USD",
    unitAmount: formData.get("unitAmount"),
    billingInterval: formData.get("billingInterval"),
    providerPriceId: formData.get("providerPriceId") || undefined,
  }

  const parsed = priceSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/products/${productId}/plans/${planId}/prices/new?error=${encodeURIComponent(msg)}`)
  }

  try {
    const price = await createPrice({ ...parsed.data, planId })
    await writeAdminAuditLog({
      actorDbUserId,
      action: "price.created",
      resourceType: "Price",
      resourceId: price.id,
      metadata: { planId, unitAmount: price.unitAmount, billingInterval: price.billingInterval },
    })
  } catch {
    redirect(`/admin/products/${productId}/plans/${planId}/prices/new?error=${encodeURIComponent("Failed to create price. Provider price ID may already be in use.")}`)
  }

  redirect(`/admin/products/${productId}/plans/${planId}`)
}

export async function updatePriceAction(
  productId: string,
  planId: string,
  priceId: string,
  formData: FormData,
): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()
  const actorDbUserId = await resolveDbUserId(clerkUserId)

  const nickname = (formData.get("nickname") as string) || undefined
  const isActive = formData.get("isActive") === "true"
  const providerPriceId = (formData.get("providerPriceId") as string) || null

  try {
    await updatePrice(priceId, { nickname, isActive, providerPriceId })
    await writeAdminAuditLog({
      actorDbUserId,
      action: "price.updated",
      resourceType: "Price",
      resourceId: priceId,
      metadata: { planId, isActive },
    })
  } catch {
    redirect(`/admin/products/${productId}/plans/${planId}?error=${encodeURIComponent("Failed to update price.")}`)
  }

  redirect(`/admin/products/${productId}/plans/${planId}`)
}
