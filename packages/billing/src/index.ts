// Entitlements — primary product-facing API
export { checkEntitlement } from "./entitlements.js"
export type { Entitlement } from "./entitlements.js"

// Subscriptions
export { createSubscription, cancelSubscription, updateSubscription } from "./subscriptions.js"

// Billing status
export { getBillingConfiguration, getOrgBillingStatus } from "./status.js"

// Webhook processor
export { processWebhookEvent } from "./webhooks.js"

// Plans
export { getPublicPlans, getAllPublicPlans, getPlanBySlug } from "./plans.js"

// Payment provider abstraction
export { getPaymentProvider } from "./providers/factory.js"
export type {
  PaymentProvider,
  ProviderWebhookEvent,
  NormalizedSubscription,
  NormalizedInvoice,
  CreateCheckoutParams,
  CheckoutSession,
} from "./providers/interface.js"

// Billing domain types
export type {
  BillingProviderName,
  BillingConfiguration,
  UpdateSubscriptionInput,
  SubscriptionUIState,
  OrgBillingStatus,
  WebhookProcessingResult,
} from "./types.js"
