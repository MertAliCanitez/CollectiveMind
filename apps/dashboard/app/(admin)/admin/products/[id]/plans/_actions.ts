"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { requirePlatformAdmin } from "../../../../../../lib/auth"
import { createPlan, updatePlan } from "../../../../../../lib/admin/plans"

const planSchema = z.object({
  name: z.string().min(1, "Name is required").max(128),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().max(512).optional(),
  billingInterval: z.enum(["FREE", "MONTH", "YEAR", "ONE_TIME"]),
  displayPrice: z.coerce.number().int("Price must be whole cents").min(0),
  currency: z.string().length(3).default("USD"),
  isPublic: z.coerce.boolean().default(true),
  status: z.enum(["ACTIVE", "LEGACY", "DEPRECATED"]).default("ACTIVE"),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
})

export async function createPlanAction(productId: string, formData: FormData): Promise<void> {
  await requirePlatformAdmin()

  const raw = {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || undefined,
    billingInterval: formData.get("billingInterval"),
    displayPrice: formData.get("displayPrice"),
    currency: formData.get("currency") || "USD",
    isPublic: formData.get("isPublic") === "true",
    status: formData.get("status") || "ACTIVE",
    sortOrder: formData.get("sortOrder") || undefined,
  }

  const parsed = planSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/products/${productId}/plans/new?error=${encodeURIComponent(msg)}`)
  }

  try {
    const plan = await createPlan({ ...parsed.data, productId })
    redirect(`/admin/products/${productId}/plans/${plan.id}`)
  } catch {
    redirect(`/admin/products/${productId}/plans/new?error=${encodeURIComponent("Failed to create plan. Slug may already be taken.")}`)
  }
}

export async function updatePlanAction(
  productId: string,
  planId: string,
  formData: FormData,
): Promise<void> {
  await requirePlatformAdmin()

  const raw = {
    name: formData.get("name"),
    description: (formData.get("description") as string) || null,
    billingInterval: formData.get("billingInterval"),
    displayPrice: formData.get("displayPrice"),
    isPublic: formData.get("isPublic") === "true",
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder") || undefined,
  }

  const updateSchema = planSchema
    .omit({ slug: true })
    .extend({ description: z.string().max(512).nullable().optional() })

  const parsed = updateSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/products/${productId}/plans/${planId}?error=${encodeURIComponent(msg)}`)
  }

  try {
    await updatePlan(planId, parsed.data)
  } catch {
    redirect(`/admin/products/${productId}/plans/${planId}?error=${encodeURIComponent("Failed to update plan.")}`)
  }

  redirect(`/admin/products/${productId}/plans/${planId}`)
}
