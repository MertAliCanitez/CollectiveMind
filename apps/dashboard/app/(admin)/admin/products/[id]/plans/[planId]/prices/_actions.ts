"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { requirePlatformAdmin } from "../../../../../../../../lib/auth"
import { createPrice, updatePrice } from "../../../../../../../../lib/admin/plans"

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
    await createPrice({ ...parsed.data, planId })
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

  const nickname = (formData.get("nickname") as string) || undefined
  const isActive = formData.get("isActive") === "true"
  const providerPriceId = (formData.get("providerPriceId") as string) || null

  try {
    await updatePrice(priceId, { nickname, isActive, providerPriceId })
  } catch {
    redirect(`/admin/products/${productId}/plans/${planId}?error=${encodeURIComponent("Failed to update price.")}`)
  }

  redirect(`/admin/products/${productId}/plans/${planId}`)
}
