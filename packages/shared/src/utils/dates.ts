const LOCALE_DEFAULT = "en-US"

/**
 * Format a date for display in admin panels and detail views.
 * e.g. "March 28, 2026 at 14:32 UTC"
 */
export function formatDateTime(date: Date | string, locale = LOCALE_DEFAULT): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(d)
}

/**
 * Format a date as a short string for compact table cells.
 * e.g. "Mar 28, 2026"
 */
export function formatDate(date: Date | string, locale = LOCALE_DEFAULT): string {
  const d = date instanceof Date ? date : new Date(date)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(d)
}

/**
 * Returns the number of days remaining until a future date.
 * Returns 0 if the date is in the past.
 */
export function daysUntil(date: Date | string): number {
  const d = date instanceof Date ? date : new Date(date)
  const diff = d.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
