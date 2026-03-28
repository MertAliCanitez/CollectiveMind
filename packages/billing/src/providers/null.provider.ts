/**
 * NullPaymentProvider — the default payment provider for v1.
 *
 * This is NOT a mock. It is a real implementation that returns safe no-ops.
 * It runs in production until a real provider adapter is configured via
 * the PAYMENT_PROVIDER environment variable.
 *
 * All checkout flows will redirect to the configured cancel URL with a
 * query param indicating the provider is not yet configured.
 */
import type {
  PaymentProvider,
  ProviderCustomer,
  CheckoutSession,
  BillingPortalSession,
  ProviderWebhookEvent,
  CreateCheckoutParams,
} from "./interface.js"

export class NullPaymentProvider implements PaymentProvider {
  async createCustomer(): Promise<ProviderCustomer> {
    return { id: "null_customer", email: "" }
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutSession> {
    // Redirect to cancel URL with a notice so the user isn't stranded
    const url = new URL(params.cancelUrl)
    url.searchParams.set("notice", "payment_not_configured")
    return { url: url.toString(), sessionId: "null_session" }
  }

  async createBillingPortalSession(
    _providerCustomerId: string,
    returnUrl: string,
  ): Promise<BillingPortalSession> {
    return { url: returnUrl }
  }

  async cancelSubscription(): Promise<void> {
    // No-op — subscription state is managed directly in the DB for v1
  }

  async updateSubscription(): Promise<void> {
    // No-op
  }

  async pauseSubscription(): Promise<void> {
    // No-op
  }

  async resumeSubscription(): Promise<void> {
    // No-op
  }

  async constructWebhookEvent(): Promise<ProviderWebhookEvent> {
    throw new Error(
      "NullPaymentProvider cannot process webhooks. " +
        "Configure a real PAYMENT_PROVIDER to handle payment events.",
    )
  }
}
