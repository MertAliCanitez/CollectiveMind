import { z } from "zod"

export const BillingIntervalSchema = z.enum(["FREE", "MONTH", "YEAR", "ONE_TIME"])
export type BillingInterval = z.infer<typeof BillingIntervalSchema>

export const SubscriptionStatusSchema = z.enum([
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "PAUSED",
  "CANCELED",
])
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>

export const PlanStatusSchema = z.enum(["ACTIVE", "LEGACY", "DEPRECATED"])
export type PlanStatus = z.infer<typeof PlanStatusSchema>

export const CreateSubscriptionSchema = z.object({
  organizationId: z.string().uuid(),
  planId: z.string().uuid(),
  trialDays: z.number().int().min(0).max(90).optional(),
  notes: z.string().max(500).optional(),
})
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>

export const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  atPeriodEnd: z.boolean().default(true),
  reason: z.string().min(1).max(500),
})
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>
