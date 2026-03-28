/**
 * Payment provider abstraction.
 * All payment providers implement this interface.
 * Product code and billing domain code only reference this interface — never a concrete provider.
 */

export interface CreateCheckoutParams {
  orgId: string
  planId: string
  /** Provider-side price ID (populated when plans are synced to the provider) */
  providerPriceId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  /** Set if the org already has a provider customer record */
  providerCustomerId?: string
}

export interface CheckoutSession {
  url: string
  sessionId: string
}

export interface BillingPortalSession {
  url: string
}

export interface ProviderCustomer {
  id: string
  email: string
}

export interface NormalizedSubscription {
  providerSubscriptionId: string
  providerCustomerId: string
  status: "trialing" | "active" | "past_due" | "canceled" | "paused"
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEndsAt: Date | null
  cancelAtPeriodEnd: boolean
  /** Provider-side price ID — used to look up the matching Plan in our DB */
  providerPriceId: string
}

export interface NormalizedInvoice {
  providerInvoiceId: string
  providerSubscriptionId: string
  status: "draft" | "open" | "paid" | "void" | "uncollectible"
  amountDue: number // cents
  amountPaid: number // cents
  currency: string
  periodStart: Date
  periodEnd: Date
  paidAt: Date | null
}

export type ProviderWebhookEvent =
  | { type: "subscription.created"; data: NormalizedSubscription }
  | { type: "subscription.updated"; data: NormalizedSubscription }
  | { type: "subscription.canceled"; data: NormalizedSubscription }
  | { type: "invoice.paid"; data: NormalizedInvoice }
  | { type: "invoice.payment_failed"; data: NormalizedInvoice }

export interface PaymentProvider {
  /** Create or retrieve a provider customer record for an organization */
  createCustomer(params: { orgId: string; email: string; name: string }): Promise<ProviderCustomer>

  /** Create a hosted checkout session */
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession>

  /** Create a billing portal session for self-serve plan/card management */
  createBillingPortalSession(
    providerCustomerId: string,
    returnUrl: string,
  ): Promise<BillingPortalSession>

  /** Cancel a subscription immediately or at period end */
  cancelSubscription(providerSubscriptionId: string, atPeriodEnd: boolean): Promise<void>

  /** Change the plan of an active subscription */
  updateSubscription(providerSubscriptionId: string, newProviderPriceId: string): Promise<void>

  /** Pause billing for a subscription */
  pauseSubscription(providerSubscriptionId: string): Promise<void>

  /** Resume a paused subscription */
  resumeSubscription(providerSubscriptionId: string): Promise<void>

  /** Verify and parse an incoming webhook payload from this provider */
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Promise<ProviderWebhookEvent>
}
