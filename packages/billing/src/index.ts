// Entitlements — primary product-facing API
export { checkEntitlement } from "./entitlements.js"
export type { Entitlement } from "./entitlements.js"

// Subscriptions
export { createSubscription, cancelSubscription, updateSubscription } from "./subscriptions.js"

// Billing status
export { getBillingConfiguration, getOrgBillingStatus } from "./status.js"

// Webhook processor
export { processWebhookEvent } from "./webhooks.js"

// Product catalog — enriched product/plan data with marketing content
export {
  getProductCatalog,
  getCatalogProduct,
  getAllProductsAdmin,
  getComingSoonProducts,
} from "./catalog.js"
export type { CatalogPlan, CatalogProduct, CatalogFeature, ProductCatalog } from "./catalog.js"

// Product marketing content
export { getProductContent, getPlanContent, getFeatureDisplayConfig } from "./product-content.js"
export type { ProductContent, PlanContent, FeatureDisplay, PlanBadge } from "./product-content.js"

// Plans (thin DB query layer — prefer catalog.ts for UI work)
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
