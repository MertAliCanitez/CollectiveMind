/**
 * Clerk → Database sync handlers.
 * Called from the Clerk webhook route handler in each app.
 * All operations are idempotent (upsert/updateMany).
 */
import { db } from "@repo/database"
import { logger } from "@repo/shared"

// Minimal Clerk webhook event types (subset we care about)
type ClerkUserEvent = {
  type: "user.created" | "user.updated" | "user.deleted"
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name: string | null
    last_name: string | null
    image_url: string | null
  }
}

type ClerkOrgEvent = {
  type: "organization.created" | "organization.updated" | "organization.deleted"
  data: {
    id: string
    name: string
    slug: string | null
    image_url: string | null
  }
}

type ClerkMembershipEvent = {
  type:
    | "organizationMembership.created"
    | "organizationMembership.updated"
    | "organizationMembership.deleted"
  data: {
    role: string
    organization: { id: string }
    public_user_data: { user_id: string }
  }
}

type ClerkWebhookEvent = ClerkUserEvent | ClerkOrgEvent | ClerkMembershipEvent

function clerkRoleToDbRole(clerkRole: string): "ADMIN" | "BILLING_MANAGER" | "MEMBER" {
  if (clerkRole === "org:admin") return "ADMIN"
  if (clerkRole === "org:billing_manager") return "BILLING_MANAGER"
  return "MEMBER"
}

export async function handleClerkWebhook(event: ClerkWebhookEvent): Promise<void> {
  logger.info("clerk.webhook", { action: event.type })

  switch (event.type) {
    case "user.created":
    case "user.updated": {
      const primaryEmail = event.data.email_addresses[0]?.email_address
      if (!primaryEmail) {
        logger.warn("clerk.webhook.no_email", { clerkId: event.data.id })
        return
      }
      await db.user.upsert({
        where: { clerkId: event.data.id },
        create: {
          clerkId: event.data.id,
          email: primaryEmail,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          avatarUrl: event.data.image_url,
        },
        update: {
          email: primaryEmail,
          firstName: event.data.first_name,
          lastName: event.data.last_name,
          avatarUrl: event.data.image_url,
        },
      })
      break
    }

    case "user.deleted": {
      await db.user.updateMany({
        where: { clerkId: event.data.id },
        data: {
          deletedAt: new Date(),
          // Null out PII on deletion (GDPR)
          email: `deleted-${event.data.id}@deleted.invalid`,
          firstName: null,
          lastName: null,
          avatarUrl: null,
        },
      })
      break
    }

    case "organization.created":
    case "organization.updated": {
      if (!event.data.slug) {
        logger.warn("clerk.webhook.no_slug", { clerkOrgId: event.data.id })
        return
      }
      await db.organization.upsert({
        where: { clerkId: event.data.id },
        create: {
          clerkId: event.data.id,
          name: event.data.name,
          slug: event.data.slug,
          logoUrl: event.data.image_url,
        },
        update: {
          name: event.data.name,
          slug: event.data.slug,
          logoUrl: event.data.image_url,
        },
      })
      break
    }

    case "organization.deleted": {
      await db.organization.updateMany({
        where: { clerkId: event.data.id },
        data: { deletedAt: new Date() },
      })
      break
    }

    case "organizationMembership.created":
    case "organizationMembership.updated": {
      const [user, org] = await Promise.all([
        db.user.findUnique({
          where: { clerkId: event.data.public_user_data.user_id },
        }),
        db.organization.findUnique({
          where: { clerkId: event.data.organization.id },
        }),
      ])

      if (!user || !org) {
        // The user or org may not have synced yet — this is a transient issue
        logger.warn("clerk.webhook.membership.missing_refs", {
          userClerkId: event.data.public_user_data.user_id,
          orgClerkId: event.data.organization.id,
          userFound: !!user,
          orgFound: !!org,
        })
        return
      }

      await db.orgMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
        create: {
          organizationId: org.id,
          userId: user.id,
          role: clerkRoleToDbRole(event.data.role),
        },
        update: {
          role: clerkRoleToDbRole(event.data.role),
        },
      })
      break
    }

    case "organizationMembership.deleted": {
      const [user, org] = await Promise.all([
        db.user.findUnique({ where: { clerkId: event.data.public_user_data.user_id } }),
        db.organization.findUnique({ where: { clerkId: event.data.organization.id } }),
      ])

      if (user && org) {
        await db.orgMember.deleteMany({
          where: { organizationId: org.id, userId: user.id },
        })
      }
      break
    }
  }
}
