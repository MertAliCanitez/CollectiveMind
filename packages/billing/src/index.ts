// Entitlements — primary product-facing API
export { checkEntitlement } from "./entitlements.js"
export type { Entitlement } from "./entitlements.js"

// Subscriptions
export { createSubscription, cancelSubscription } from "./subscriptions.js"

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
