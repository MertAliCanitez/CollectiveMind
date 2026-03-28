/**
 * Integration tests for Clerk → Database webhook sync.
 *
 * These tests hit a real test database.
 * Requires TEST_DATABASE_URL to be set.
 *
 * Each test runs against a clean database via cleanDatabase() in beforeEach.
 * All operations are idempotent — calling twice should produce the same result.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { handleClerkWebhook } from "../src/sync.js"
import { testDb, cleanDatabase, createTestUser, createTestOrg } from "@repo/testing"

beforeEach(cleanDatabase)

afterAll(async () => {
  await testDb.$disconnect()
})

// ─── User sync ────────────────────────────────────────────────────────────────

describe("user.created", () => {
  it("creates a user with email and name", async () => {
    await handleClerkWebhook({
      type: "user.created",
      data: {
        id: "clerk_user_abc",
        email_addresses: [{ email_address: "alice@example.com" }],
        first_name: "Alice",
        last_name: "Smith",
        image_url: null,
      },
    })

    const user = await testDb.user.findUnique({ where: { clerkId: "clerk_user_abc" } })
    expect(user).not.toBeNull()
    expect(user!.email).toBe("alice@example.com")
    expect(user!.firstName).toBe("Alice")
    expect(user!.lastName).toBe("Smith")
    expect(user!.deletedAt).toBeNull()
  })

  it("handles null first/last name gracefully", async () => {
    await handleClerkWebhook({
      type: "user.created",
      data: {
        id: "clerk_user_no_name",
        email_addresses: [{ email_address: "anon@example.com" }],
        first_name: null,
        last_name: null,
        image_url: null,
      },
    })

    const user = await testDb.user.findUnique({ where: { clerkId: "clerk_user_no_name" } })
    expect(user!.firstName).toBeNull()
    expect(user!.lastName).toBeNull()
  })

  it("does nothing when no email address is present", async () => {
    await handleClerkWebhook({
      type: "user.created",
      data: {
        id: "clerk_user_noemail",
        email_addresses: [],
        first_name: "Ghost",
        last_name: null,
        image_url: null,
      },
    })

    const user = await testDb.user.findUnique({ where: { clerkId: "clerk_user_noemail" } })
    expect(user).toBeNull()
  })
})

describe("user.updated", () => {
  it("updates an existing user's email and name", async () => {
    await handleClerkWebhook({
      type: "user.created",
      data: {
        id: "clerk_upd_1",
        email_addresses: [{ email_address: "old@example.com" }],
        first_name: "Old",
        last_name: null,
        image_url: null,
      },
    })

    await handleClerkWebhook({
      type: "user.updated",
      data: {
        id: "clerk_upd_1",
        email_addresses: [{ email_address: "new@example.com" }],
        first_name: "New",
        last_name: "Name",
        image_url: "https://cdn.example.com/avatar.png",
      },
    })

    const user = await testDb.user.findUnique({ where: { clerkId: "clerk_upd_1" } })
    expect(user!.email).toBe("new@example.com")
    expect(user!.firstName).toBe("New")
    expect(user!.lastName).toBe("Name")
    expect(user!.avatarUrl).toBe("https://cdn.example.com/avatar.png")
  })

  it("upserts (creates) when user does not yet exist in DB", async () => {
    await handleClerkWebhook({
      type: "user.updated",
      data: {
        id: "clerk_late_sync",
        email_addresses: [{ email_address: "late@example.com" }],
        first_name: "Late",
        last_name: null,
        image_url: null,
      },
    })

    const user = await testDb.user.findUnique({ where: { clerkId: "clerk_late_sync" } })
    expect(user).not.toBeNull()
    expect(user!.email).toBe("late@example.com")
  })
})

describe("user.deleted", () => {
  it("soft-deletes and anonymizes PII (GDPR)", async () => {
    await createTestUser({ clerkId: "clerk_del_1", email: "real@example.com", firstName: "Real" })

    await handleClerkWebhook({
      type: "user.deleted",
      data: {
        id: "clerk_del_1",
        email_addresses: [],
        first_name: null,
        last_name: null,
        image_url: null,
      },
    })

    const user = await testDb.user.findFirst({ where: { clerkId: "clerk_del_1" } })
    expect(user!.deletedAt).not.toBeNull()
    expect(user!.email).toMatch(/^deleted-/)
    expect(user!.firstName).toBeNull()
    expect(user!.lastName).toBeNull()
    expect(user!.avatarUrl).toBeNull()
  })

  it("does not throw when user does not exist in DB", async () => {
    // updateMany on zero rows should not throw
    await expect(
      handleClerkWebhook({
        type: "user.deleted",
        data: {
          id: "clerk_ghost",
          email_addresses: [],
          first_name: null,
          last_name: null,
          image_url: null,
        },
      }),
    ).resolves.not.toThrow()
  })
})

// ─── Organization sync ────────────────────────────────────────────────────────

describe("organization.created", () => {
  it("creates an organization with name and slug", async () => {
    await handleClerkWebhook({
      type: "organization.created",
      data: {
        id: "clerk_org_1",
        name: "Acme Corp",
        slug: "acme-corp",
        image_url: null,
      },
    })

    const org = await testDb.organization.findUnique({ where: { clerkId: "clerk_org_1" } })
    expect(org).not.toBeNull()
    expect(org!.name).toBe("Acme Corp")
    expect(org!.slug).toBe("acme-corp")
  })

  it("does nothing when slug is missing", async () => {
    await handleClerkWebhook({
      type: "organization.created",
      data: {
        id: "clerk_org_noslug",
        name: "No Slug Org",
        slug: null,
        image_url: null,
      },
    })

    const org = await testDb.organization.findUnique({ where: { clerkId: "clerk_org_noslug" } })
    expect(org).toBeNull()
  })
})

describe("organization.updated", () => {
  it("updates name and slug on an existing org", async () => {
    await handleClerkWebhook({
      type: "organization.created",
      data: { id: "clerk_org_upd", name: "Old Name", slug: "old-slug", image_url: null },
    })

    await handleClerkWebhook({
      type: "organization.updated",
      data: { id: "clerk_org_upd", name: "New Name", slug: "new-slug", image_url: null },
    })

    const org = await testDb.organization.findUnique({ where: { clerkId: "clerk_org_upd" } })
    expect(org!.name).toBe("New Name")
    expect(org!.slug).toBe("new-slug")
  })
})

describe("organization.deleted", () => {
  it("soft-deletes the organization", async () => {
    await createTestOrg({ clerkId: "clerk_org_del" })

    await handleClerkWebhook({
      type: "organization.deleted",
      data: { id: "clerk_org_del", name: "", slug: null, image_url: null },
    })

    const org = await testDb.organization.findFirst({ where: { clerkId: "clerk_org_del" } })
    expect(org!.deletedAt).not.toBeNull()
  })
})

// ─── Membership sync ──────────────────────────────────────────────────────────

describe("organizationMembership.created", () => {
  it("creates an org member with ADMIN role", async () => {
    const user = await createTestUser({ clerkId: "clerk_mem_user" })
    const org = await createTestOrg({ clerkId: "clerk_mem_org" })

    await handleClerkWebhook({
      type: "organizationMembership.created",
      data: {
        role: "org:admin",
        organization: { id: org.clerkId },
        public_user_data: { user_id: user.clerkId },
      },
    })

    const member = await testDb.orgMember.findFirst({
      where: { organizationId: org.id, userId: user.id },
    })
    expect(member).not.toBeNull()
    expect(member!.role).toBe("ADMIN")
  })

  it("converts org:billing_manager to BILLING_MANAGER", async () => {
    const user = await createTestUser({ clerkId: "clerk_bm_user" })
    const org = await createTestOrg({ clerkId: "clerk_bm_org" })

    await handleClerkWebhook({
      type: "organizationMembership.created",
      data: {
        role: "org:billing_manager",
        organization: { id: org.clerkId },
        public_user_data: { user_id: user.clerkId },
      },
    })

    const member = await testDb.orgMember.findFirst({
      where: { organizationId: org.id, userId: user.id },
    })
    expect(member!.role).toBe("BILLING_MANAGER")
  })

  it("defaults unknown roles to MEMBER", async () => {
    const user = await createTestUser({ clerkId: "clerk_unk_user" })
    const org = await createTestOrg({ clerkId: "clerk_unk_org" })

    await handleClerkWebhook({
      type: "organizationMembership.created",
      data: {
        role: "org:some_future_role",
        organization: { id: org.clerkId },
        public_user_data: { user_id: user.clerkId },
      },
    })

    const member = await testDb.orgMember.findFirst({
      where: { organizationId: org.id, userId: user.id },
    })
    expect(member!.role).toBe("MEMBER")
  })

  it("does not throw when user or org not yet synced", async () => {
    await expect(
      handleClerkWebhook({
        type: "organizationMembership.created",
        data: {
          role: "org:admin",
          organization: { id: "clerk_unknown_org" },
          public_user_data: { user_id: "clerk_unknown_user" },
        },
      }),
    ).resolves.not.toThrow()
  })
})

describe("organizationMembership.updated", () => {
  it("updates the role of an existing member", async () => {
    const user = await createTestUser({ clerkId: "clerk_role_user" })
    const org = await createTestOrg({ clerkId: "clerk_role_org" })

    await handleClerkWebhook({
      type: "organizationMembership.created",
      data: {
        role: "org:member",
        organization: { id: org.clerkId },
        public_user_data: { user_id: user.clerkId },
      },
    })

    await handleClerkWebhook({
      type: "organizationMembership.updated",
      data: {
        role: "org:admin",
        organization: { id: org.clerkId },
        public_user_data: { user_id: user.clerkId },
      },
    })

    const member = await testDb.orgMember.findFirst({
      where: { organizationId: org.id, userId: user.id },
    })
    expect(member!.role).toBe("ADMIN")
  })
})

describe("organizationMembership.deleted", () => {
  it("removes the membership record", async () => {
    const user = await createTestUser({ clerkId: "clerk_leave_user" })
    const org = await createTestOrg({ clerkId: "clerk_leave_org" })

    await testDb.orgMember.create({
      data: { organizationId: org.id, userId: user.id, role: "MEMBER" },
    })

    await handleClerkWebhook({
      type: "organizationMembership.deleted",
      data: {
        role: "org:member",
        organization: { id: org.clerkId },
        public_user_data: { user_id: user.clerkId },
      },
    })

    const count = await testDb.orgMember.count({
      where: { organizationId: org.id, userId: user.id },
    })
    expect(count).toBe(0)
  })

  it("does not throw when membership does not exist", async () => {
    const user = await createTestUser({ clerkId: "clerk_nomem_user" })
    const org = await createTestOrg({ clerkId: "clerk_nomem_org" })

    await expect(
      handleClerkWebhook({
        type: "organizationMembership.deleted",
        data: {
          role: "org:member",
          organization: { id: org.clerkId },
          public_user_data: { user_id: user.clerkId },
        },
      }),
    ).resolves.not.toThrow()
  })
})
