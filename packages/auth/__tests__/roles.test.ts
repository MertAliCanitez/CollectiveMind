/**
 * Unit tests for role-check utilities.
 *
 * These are pure functions — no DB, no network, no mocks.
 * They are the foundation of every auth boundary in the platform.
 */
import { describe, it, expect } from "vitest"
import {
  isOrgAdmin,
  isOrgBillingManager,
  isPlatformAdmin,
  isPlatformStaff,
} from "../src/roles.js"

// ─── isOrgAdmin ───────────────────────────────────────────────────────────────

describe("isOrgAdmin", () => {
  it("returns true for org:admin", () => {
    expect(isOrgAdmin("org:admin")).toBe(true)
  })

  it("returns false for org:billing_manager", () => {
    expect(isOrgAdmin("org:billing_manager")).toBe(false)
  })

  it("returns false for org:member", () => {
    expect(isOrgAdmin("org:member")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isOrgAdmin(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isOrgAdmin(undefined)).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isOrgAdmin("")).toBe(false)
  })

  it("is case-sensitive (no uppercase variant)", () => {
    expect(isOrgAdmin("org:Admin")).toBe(false)
  })
})

// ─── isOrgBillingManager ──────────────────────────────────────────────────────

describe("isOrgBillingManager", () => {
  it("returns true for org:admin (admin is superset)", () => {
    expect(isOrgBillingManager("org:admin")).toBe(true)
  })

  it("returns true for org:billing_manager", () => {
    expect(isOrgBillingManager("org:billing_manager")).toBe(true)
  })

  it("returns false for org:member", () => {
    expect(isOrgBillingManager("org:member")).toBe(false)
  })

  it("returns false for null", () => {
    expect(isOrgBillingManager(null)).toBe(false)
  })

  it("returns false for undefined", () => {
    expect(isOrgBillingManager(undefined)).toBe(false)
  })
})

// ─── isPlatformAdmin ──────────────────────────────────────────────────────────

describe("isPlatformAdmin", () => {
  it("returns true when platformRole is super_admin", () => {
    expect(isPlatformAdmin({ platformRole: "super_admin" })).toBe(true)
  })

  it("returns false when platformRole is support", () => {
    expect(isPlatformAdmin({ platformRole: "support" })).toBe(false)
  })

  it("returns false when platformRole is missing", () => {
    expect(isPlatformAdmin({})).toBe(false)
  })

  it("returns false for null claims", () => {
    expect(isPlatformAdmin(null)).toBe(false)
  })

  it("returns false for undefined claims", () => {
    expect(isPlatformAdmin(undefined)).toBe(false)
  })

  it("returns false for unrelated claims payload", () => {
    expect(isPlatformAdmin({ sub: "user_123", iat: 1000 })).toBe(false)
  })
})

// ─── isPlatformStaff ──────────────────────────────────────────────────────────

describe("isPlatformStaff", () => {
  it("returns true for super_admin", () => {
    expect(isPlatformStaff({ platformRole: "super_admin" })).toBe(true)
  })

  it("returns true for support", () => {
    expect(isPlatformStaff({ platformRole: "support" })).toBe(true)
  })

  it("returns false for unknown role", () => {
    expect(isPlatformStaff({ platformRole: "viewer" })).toBe(false)
  })

  it("returns false when platformRole is absent", () => {
    expect(isPlatformStaff({})).toBe(false)
  })

  it("returns false for null claims", () => {
    expect(isPlatformStaff(null)).toBe(false)
  })
})
