/**
 * Clerk webhook signature verification.
 *
 * Usage in a route handler:
 *
 *   const payload = await req.text()
 *   const event = await verifyClerkWebhook(payload, req.headers, process.env.CLERK_WEBHOOK_SECRET!)
 *   await handleClerkWebhook(event)
 */
import { Webhook } from "svix"
import type { WebhookRequiredHeaders } from "svix"
import { logger } from "@repo/shared"

type SvixHeaders = {
  "svix-id": string
  "svix-timestamp": string
  "svix-signature": string
}

function extractSvixHeaders(headers: Headers | SvixHeaders): SvixHeaders {
  if (headers instanceof Headers) {
    return {
      "svix-id": headers.get("svix-id") ?? "",
      "svix-timestamp": headers.get("svix-timestamp") ?? "",
      "svix-signature": headers.get("svix-signature") ?? "",
    }
  }
  return headers
}

/**
 * Verifies a Clerk webhook signature and returns the parsed event payload.
 * Throws if the signature is invalid or required headers are missing.
 *
 * @param payload - Raw request body string (not parsed JSON)
 * @param headers - Request headers (Headers object or pre-extracted svix headers)
 * @param secret  - The CLERK_WEBHOOK_SECRET from your Clerk dashboard
 */
export function verifyClerkWebhook(
  payload: string,
  headers: Headers | SvixHeaders,
  secret: string,
): unknown {
  const svixHeaders = extractSvixHeaders(headers)

  if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
    logger.warn("clerk.webhook.missing_headers", { headers: Object.keys(svixHeaders) })
    throw new Error("Missing required svix headers")
  }

  const wh = new Webhook(secret)

  try {
    return wh.verify(payload, svixHeaders as WebhookRequiredHeaders)
  } catch (err) {
    logger.warn("clerk.webhook.invalid_signature", { error: String(err) })
    throw new Error("Invalid webhook signature")
  }
}
