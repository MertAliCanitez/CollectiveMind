/**
 * Format an integer amount in cents as a human-readable currency string.
 *
 * @param amountInCents - Integer amount in the smallest currency unit (cents)
 * @param currency      - ISO 4217 currency code (e.g., "USD", "EUR", "TRY")
 * @param locale        - BCP 47 locale tag (defaults to "en-US")
 */
export function formatCurrency(
  amountInCents: number,
  currency: string,
  locale = "en-US",
): string {
  const amount = amountInCents / 100
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Convert cents to a decimal number (for display logic, not for storage).
 * Never use the result for arithmetic stored back to the database.
 */
export function centsToDecimal(amountInCents: number): number {
  return amountInCents / 100
}

/**
 * Convert a decimal amount to cents for storage.
 * Rounds to the nearest cent to avoid floating-point drift.
 */
export function decimalToCents(amount: number): number {
  return Math.round(amount * 100)
}
