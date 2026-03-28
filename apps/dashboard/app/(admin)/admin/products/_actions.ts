"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { requirePlatformAdmin } from "../../../../lib/auth"
import { createProduct, updateProduct, type CreateProductInput } from "../../../../lib/admin/products"
import { resolveDbUserId, writeAdminAuditLog } from "../../../../lib/admin/audit"

const productSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  name: z.string().min(1, "Name is required").max(128),
  description: z.string().max(512).optional(),
  status: z.enum(["ACTIVE", "COMING_SOON", "DEPRECATED"]),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
})

export async function createProductAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()
  const actorDbUserId = await resolveDbUserId(clerkUserId)

  const raw = {
    slug: formData.get("slug"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder") || undefined,
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/products/new?error=${encodeURIComponent(msg)}`)
  }

  try {
    const product = await createProduct(parsed.data as CreateProductInput)
    await writeAdminAuditLog({
      actorDbUserId,
      action: "product.created",
      resourceType: "Product",
      resourceId: product.id,
      metadata: { slug: product.slug, status: product.status },
    })
    redirect(`/admin/products/${product.id}`)
  } catch {
    redirect(`/admin/products/new?error=${encodeURIComponent("Failed to create product. Slug may already be taken.")}`)
  }
}

export async function updateProductAction(id: string, formData: FormData): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()
  const actorDbUserId = await resolveDbUserId(clerkUserId)

  const raw = {
    name: formData.get("name"),
    description: (formData.get("description") as string) || null,
    status: formData.get("status"),
    sortOrder: formData.get("sortOrder") || undefined,
  }

  const updateSchema = productSchema.pick({ name: true, status: true, sortOrder: true }).extend({
    description: z.string().max(512).nullable().optional(),
  })

  const parsed = updateSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/products/${id}?error=${encodeURIComponent(msg)}`)
  }

  try {
    const updated = await updateProduct(id, parsed.data)
    await writeAdminAuditLog({
      actorDbUserId,
      action: "product.updated",
      resourceType: "Product",
      resourceId: id,
      metadata: { slug: updated.slug, status: updated.status },
    })
  } catch {
    redirect(`/admin/products/${id}?error=${encodeURIComponent("Failed to update product.")}`)
  }

  redirect(`/admin/products/${id}`)
}
