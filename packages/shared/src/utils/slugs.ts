/**
 * Generate a URL-safe slug from a string.
 * "Acme Corp." → "acme-corp"
 */
export function createSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars except hyphens
    .replace(/[\s_]+/g, "-") // spaces and underscores to hyphens
    .replace(/-+/g, "-") // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
}

/**
 * Validate that a string is a valid slug.
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}
