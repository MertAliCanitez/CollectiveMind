/**
 * Provider webhook event processor.
 *
 * This module is the single entry point for all payment provider events.
 * It sits between the raw webhook route handler and the database.
 *
 * Architecture:
 *
 *   Provider → HTTP POST to /api/webhooks/billing
 *            → Provider adapter verifies signature + normalizes event
 *            → processWebhookEvent(normalizedEvent)     ← this module
 *            → DB mutation + AuditLog
 *
 * The normalization step (provider adapter → ProviderWebhookEvent) means
 * this module never sees Stripe/Paddle/etc-specific types. Swapping providers
 * only requires a new adapter, not changes here.
 *
 * Idempotency:
 *   All handlers are safe to call multiple times for the same event.
 *   Providers may retry failed deliveries; the DB upsert/updateMany patterns
 *   prevent duplicate records.
 *
 * Current status:
 *   At v1, no provider is configured (NullPaymentProvider). These handlers
 *   will not be called in production until PAYMENT_PROVIDER is set.
 *   They are fully implemented now so provider integration requires only
 *   writing the adapter, not the business logic.
 */
import { db } from "@repo/database"
import { logger } from "@repo/shared"
import type { ProviderWebhookEvent, NormalizedSubscription, NormalizedInvoice } from "./providers/interface.js"
import type { WebhookProcessingResult } from "./types.js"

// ─── Main dispatcher ──────────────────────────────────────────────────────────

/**
 * Process a normalized webhook event from any payment provider.
 *
 * Called from the billing webhook route handler after the provider adapter
 * has verified the signature and produced a ProviderWebhookEvent.
 *
 * @example
 * // In apps/dashboard/app/api/webhooks/billing/route.ts:
 * const provider = getPaymentProvider()
 * const event = await provider.constructWebhookEvent(payload, signature)
 * const result = await processWebhookEvent(event)
 * if (!result.ok) logger.warn("webhook.skipped", result)
 */
export async function processWebhookEvent(
  event: ProviderWebhookEvent,
): Promise<WebhookProcessingResult> {
  logger.info("billing.webhook.received", { type: event.type })

  switch (event.type) {
    case "subscription.created":
    case "subscription.updated":
      return handleSubscriptionUpsert(event.data)

    case "subscription.canceled":
      return handleSubscriptionCanceled(event.data)

    case "invoice.paid":
      return handleInvoicePaid(event.data)

    case "invoice.payment_failed":
      return handleInvoicePaymentFailed(event.data)
  }
}

// ─── Subscription handlers ────────────────────────────────────────────────────

/**
 * Handles subscription.created and subscription.updated events.
 *
 * Looks up the organization via providerCustomerId and the plan via
 * providerPriceId (the Price table links Plan → provider price IDs).
 *
 * If the subscription already exists (by providerSubscriptionId), it is
 * updated. Otherwise a new Subscription record is created.
 *
 * Idempotent: safe to call multiple times for the same event.
 */
async function handleSubscriptionUpsert(
  data: NormalizedSubscription,
): Promise<WebhookProcessingResult> {
  // 1. Resolve the organization from the provider customer ID
  const existingSubscription = await db.subscription.findFirst({
    where: { providerCustomerId: data.providerCustomerId },
    select: { organizationId: true },
  })

  const organizationId = existingSubscription?.organizationId

  if (!organizationId) {
    logger.warn("billing.webhook.no_org_for_customer", {
      providerCustomerId: data.providerCustomerId,
      providerSubscriptionId: data.providerSubscriptionId,
    })
    return {
      ok: false,
      reason: `No organization found for customer ${data.providerCustomerId}`,
      skipped: true,
    }
  }

  // 2. Resolve the Plan via the Price table (Price.providerPriceId → Plan)
  const price = await db.price.findUnique({
    where: { providerPriceId: data.providerPriceId },
    select: { planId: true, id: true },
  })

  if (!price) {
    logger.warn("billing.webhook.no_plan_for_price", {
      providerPriceId: data.providerPriceId,
      providerSubscriptionId: data.providerSubscriptionId,
    })
    return {
      ok: false,
      reason: `No plan found for provider price ID ${data.providerPriceId}`,
      skipped: true,
    }
  }

  // 3. Map normalized status to DB enum
  const status = normalizeSubscriptionStatus(data.status)

  // 4. Upsert the subscription (idempotent on providerSubscriptionId)
  const subscription = await db.subscription.upsert({
    where: { providerSubscriptionId: data.providerSubscriptionId },
    create: {
      organizationId,
      planId: price.planId,
      priceId: price.id,
      status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      providerSubscriptionId: data.providerSubscriptionId,
      providerCustomerId: data.providerCustomerId,
    },
    update: {
      planId: price.planId,
      priceId: price.id,
      status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      trialEndsAt: data.trialEndsAt,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    },
  })

  await db.auditLog.create({
    data: {
      actorType: "SYSTEM",
      organizationId,
      action: "subscription.synced_from_provider",
      resourceType: "Subscription",
      resourceId: subscription.id,
      metadata: {
        providerSubscriptionId: data.providerSubscriptionId,
        status,
        providerPriceId: data.providerPriceId,
      },
    },
  })

  logger.info("billing.webhook.subscription_upserted", {
    subscriptionId: subscription.id,
    orgId: organizationId,
    status,
  })

  return { ok: true, action: "subscription.upserted", resourceId: subscription.id }
}

/**
 * Handles subscription.canceled events.
 * Updates status to CANCELED and sets canceledAt.
 */
async function handleSubscriptionCanceled(
  data: NormalizedSubscription,
): Promise<WebhookProcessingResult> {
  const updated = await db.subscription.updateMany({
    where: { providerSubscriptionId: data.providerSubscriptionId },
    data: {
      status: "CANCELED",
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    },
  })

  if (updated.count === 0) {
    return {
      ok: false,
      reason: `Subscription not found: ${data.providerSubscriptionId}`,
      skipped: true,
    }
  }

  logger.info("billing.webhook.subscription_canceled", {
    providerSubscriptionId: data.providerSubscriptionId,
  })

  return {
    ok: true,
    action: "subscription.canceled",
    resourceId: data.providerSubscriptionId,
  }
}

// ─── Invoice handlers ─────────────────────────────────────────────────────────

/**
 * Handles invoice.paid events.
 * Creates or updates the Invoice record and marks it PAID.
 */
async function handleInvoicePaid(
  data: NormalizedInvoice,
): Promise<WebhookProcessingResult> {
  const subscription = await db.subscription.findFirst({
    where: { providerSubscriptionId: data.providerSubscriptionId },
    select: { id: true, organizationId: true },
  })

  if (!subscription) {
    logger.warn("billing.webhook.no_subscription_for_invoice", {
      providerSubscriptionId: data.providerSubscriptionId,
      providerInvoiceId: data.providerInvoiceId,
    })
    return {
      ok: false,
      reason: `No subscription found for ${data.providerSubscriptionId}`,
      skipped: true,
    }
  }

  const invoiceNumber = await generateInvoiceNumber()

  const invoice = await db.invoice.upsert({
    where: { providerInvoiceId: data.providerInvoiceId },
    create: {
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      invoiceNumber,
      status: "PAID",
      amountDue: data.amountDue,
      amountPaid: data.amountPaid,
      currency: data.currency,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      paidAt: data.paidAt,
      providerInvoiceId: data.providerInvoiceId,
    },
    update: {
      status: "PAID",
      amountPaid: data.amountPaid,
      paidAt: data.paidAt,
    },
  })

  logger.info("billing.webhook.invoice_paid", {
    invoiceId: invoice.id,
    orgId: subscription.organizationId,
    amountPaid: data.amountPaid,
    currency: data.currency,
  })

  return { ok: true, action: "invoice.paid", resourceId: invoice.id }
}

/**
 * Handles invoice.payment_failed events.
 * Marks the subscription as PAST_DUE and the invoice as OPEN.
 */
async function handleInvoicePaymentFailed(
  data: NormalizedInvoice,
): Promise<WebhookProcessingResult> {
  const subscription = await db.subscription.findFirst({
    where: { providerSubscriptionId: data.providerSubscriptionId },
    select: { id: true, organizationId: true },
  })

  if (!subscription) {
    return {
      ok: false,
      reason: `No subscription found for ${data.providerSubscriptionId}`,
      skipped: true,
    }
  }

  // Move subscription to past_due
  await db.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  })

  // Upsert the invoice as OPEN (not yet paid)
  const invoiceNumber = await generateInvoiceNumber()
  const invoice = await db.invoice.upsert({
    where: { providerInvoiceId: data.providerInvoiceId },
    create: {
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      invoiceNumber,
      status: "OPEN",
      amountDue: data.amountDue,
      amountPaid: 0,
      currency: data.currency,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      providerInvoiceId: data.providerInvoiceId,
    },
    update: {
      status: "OPEN",
    },
  })

  await db.auditLog.create({
    data: {
      actorType: "SYSTEM",
      organizationId: subscription.organizationId,
      action: "invoice.payment_failed",
      resourceType: "Invoice",
      resourceId: invoice.id,
      metadata: {
        providerInvoiceId: data.providerInvoiceId,
        amountDue: data.amountDue,
        currency: data.currency,
      },
    },
  })

  logger.warn("billing.webhook.payment_failed", {
    subscriptionId: subscription.id,
    orgId: subscription.organizationId,
    amountDue: data.amountDue,
  })

  return { ok: true, action: "invoice.payment_failed", resourceId: invoice.id }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeSubscriptionStatus(
  status: NormalizedSubscription["status"],
): "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELED" {
  const map = {
    trialing: "TRIALING",
    active: "ACTIVE",
    past_due: "PAST_DUE",
    paused: "PAUSED",
    canceled: "CANCELED",
  } as const
  return map[status]
}

/**
 * Generates the next sequential invoice number.
 * Format: INV-YYYY-NNNN (e.g., INV-2026-0042)
 *
 * Uses a DB count to determine the next number. This is not perfectly
 * atomic under high concurrency, but invoice creation is low-frequency
 * and duplicates are caught by the unique constraint on invoiceNumber.
 */
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.invoice.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      },
    },
  })
  const sequence = String(count + 1).padStart(4, "0")
  return `INV-${year}-${sequence}`
}
