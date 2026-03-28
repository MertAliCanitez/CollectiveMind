/**
 * Clerk webhook handler.
 *
 * Receives webhook events from Clerk and syncs identity data to the database.
 * This is the only route that writes User, Organization, and OrgMember records.
 *
 * Security:
 *   - Every request is verified with an HMAC signature (svix)
 *   - The route is public (no Clerk session required — Clerk calls it server-to-server)
 *   - Returns 400 for invalid signatures — never 401 (don't reveal auth info)
 *   - The raw body is read as text, not JSON, to preserve the exact bytes for signature
 *     verification (parsing first would alter whitespace and break the HMAC check)
 *
 * Events handled (see packages/auth/src/sync.ts):
 *   user.created, user.updated, user.deleted
 *   organization.created, organization.updated, organization.deleted
 *   organizationMembership.created, organizationMembership.updated, organizationMembership.deleted
 *
 * Setup:
 *   - Set CLERK_WEBHOOK_SECRET from Clerk dashboard → Webhooks → your endpoint → Signing Secret
 *   - Subscribe to: user.*, organization.*, organizationMembership.*
 */
import { NextResponse } from "next/server"
import { verifyClerkWebhook, handleClerkWebhook } from "@repo/auth"
import { logger } from "@repo/shared"

export async function POST(req: Request): Promise<NextResponse> {
  // 1. Validate the webhook secret is configured
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error("clerk.webhook.no_secret", {
      message: "CLERK_WEBHOOK_SECRET is not set",
    })
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  // 2. Read the raw body BEFORE any parsing
  //    Parsing changes whitespace, which breaks svix HMAC verification.
  const payload = await req.text()

  // 3. Verify the signature
  let event: unknown
  try {
    event = verifyClerkWebhook(payload, req.headers, webhookSecret)
  } catch {
    // Do not log the payload — it may contain PII before verification
    logger.warn("clerk.webhook.signature_invalid", {
      svixId: req.headers.get("svix-id") ?? "missing",
    })
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // 4. Process the event
  //    handleClerkWebhook is idempotent — safe to retry on failure
  try {
    // The event type is validated inside handleClerkWebhook
    await handleClerkWebhook(event as Parameters<typeof handleClerkWebhook>[0])
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error("clerk.webhook.processing_failed", {
      error: String(err),
      svixId: req.headers.get("svix-id") ?? "missing",
    })
    // Return 500 so Clerk retries the delivery
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
