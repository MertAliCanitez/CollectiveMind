/**
 * Payment provider factory.
 * Returns the configured provider based on the PAYMENT_PROVIDER env var.
 * Defaults to NullPaymentProvider if not configured.
 */
import type { PaymentProvider } from "./interface.js"
import { NullPaymentProvider } from "./null.provider.js"

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env["PAYMENT_PROVIDER"]

  switch (provider) {
    case "stripe":
      // TODO: import and return StripeProvider when implemented
      throw new Error(
        "Stripe provider is not yet implemented. " +
          "See .claude/skills/billing-architecture/SKILL.md for the implementation guide.",
      )

    case "paddle":
      throw new Error("Paddle provider is not yet implemented.")

    case "lemon_squeezy":
      throw new Error("Lemon Squeezy provider is not yet implemented.")

    case "iyzico":
      throw new Error("iyzico provider is not yet implemented.")

    case undefined:
    case "":
    case "null":
    default:
      return new NullPaymentProvider()
  }
}
