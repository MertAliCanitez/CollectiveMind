"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { auth } from "@clerk/nextjs/server"
import { requirePlatformAdmin } from "../../../../lib/auth"
import { createGrant, revokeGrant } from "../../../../lib/admin/grants"
import { db } from "@repo/database"

const grantSchema = z.object({
  organizationId: z.string().min(1, "Organization is required"),
  productId: z.string().min(1, "Product is required"),
  reason: z.string().max(512).optional(),
  expiresAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
})

export async function createGrantAction(formData: FormData): Promise<void> {
  await requirePlatformAdmin()
  const { userId: clerkUserId } = await auth()

  const raw = {
    organizationId: formData.get("organizationId"),
    productId: formData.get("productId"),
    reason: formData.get("reason") || undefined,
    expiresAt: formData.get("expiresAt") || undefined,
  }

  const parsed = grantSchema.safeParse(raw)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? "Validation failed"
    redirect(`/admin/grants/new?error=${encodeURIComponent(msg)}`)
  }

  const dbUser = clerkUserId
    ? await db.user.findFirst({ where: { clerkId: clerkUserId } })
    : null

  try {
    await createGrant({
      ...parsed.data,
      grantedByUserId: dbUser?.id ?? undefined,
    })
  } catch {
    redirect(`/admin/grants/new?error=${encodeURIComponent("Failed to create grant.")}`)
  }

  redirect("/admin/grants")
}

export async function revokeGrantAction(grantId: string): Promise<void> {
  await requirePlatformAdmin()

  await revokeGrant(grantId)
}
