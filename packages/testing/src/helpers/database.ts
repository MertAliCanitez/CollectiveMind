/**
 * Database test helpers.
 * Use these in integration tests to set up and tear down test data.
 *
 * All helpers use the TEST_DATABASE_URL — never the dev database.
 */
import { PrismaClient } from "@prisma/client"

// Test-scoped Prisma client — connects to the test DB
export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env["TEST_DATABASE_URL"] ?? process.env["DATABASE_URL"],
    },
  },
})

/**
 * Truncate all business tables in the correct FK-safe order.
 * Call this in beforeEach() for integration tests that write to the DB.
 */
export async function cleanDatabase(): Promise<void> {
  await testDb.$executeRaw`
    TRUNCATE
      "AuditLog",
      "InvoiceLineItem",
      "Invoice",
      "Subscription",
      "AccessGrant",
      "Price",
      "PlanFeature",
      "Plan",
      "Product",
      "OrgMember",
      "Organization",
      "User"
    RESTART IDENTITY CASCADE
  `
}
