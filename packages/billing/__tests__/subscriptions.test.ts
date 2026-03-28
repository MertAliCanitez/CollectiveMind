/**
 * Integration tests for the subscription state machine.
 *
 * createSubscription / cancelSubscription / updateSubscription are the
 * only entry points for subscription mutations. These tests verify
 * state transitions, period-end calculations, and audit log creation.
 *
 * Requires TEST_DATABASE_URL to be set.
 */
import { describe, it, expect, beforeEach, afterAll } from "vitest"
import { createSubscription, cancelSubscription, updateSubscription } from "../src/subscriptions.js"
import {
  testDb,
  cleanDatabase,
  createTestOrg,
  createTestProduct,
  createTestPlan,
} from "@repo/testing"

beforeEach(cleanDatabase)

afterAll(async () => {
  await testDb.$disconnect()
})

async function setup(billingInterval: "MONTH" | "YEAR" | "FREE" | "ONE_TIME" = "MONTH") {
  const org = await createTestOrg()
  const product = await createTestProduct()
  const plan = await createTestPlan({ productId: product.id, billingInterval })
  return { org, product, plan }
}

// ─── createSubscription ───────────────────────────────────────────────────────

describe("createSubscription", () => {
  it("creates a subscription with ACTIVE status when no trial", async () => {
    const { org, plan } = await setup()

    const sub = await createSubscription({ organizationId: org.id, planId: plan.id })

    expect(sub.status).toBe("ACTIVE")
    expect(sub.trialEndsAt).toBeNull()
    expect(sub.cancelAtPeriodEnd).toBe(false)
  })

  it("creates a subscription with TRIALING status when trialDays > 0", async () => {
    const { org, plan } = await setup()

    const sub = await createSubscription({
      organizationId: org.id,
      planId: plan.id,
      trialDays: 14,
    })

    expect(sub.status).toBe("TRIALING")
    expect(sub.trialEndsAt).not.toBeNull()
  })

  it("sets trialEndsAt ~14 days from now for a 14-day trial", async () => {
    const { org, plan } = await setup()
    const before = Date.now()

    const sub = await createSubscription({
      organizationId: org.id,
      planId: plan.id,
      trialDays: 14,
    })

    const expectedMs = 14 * 24 * 60 * 60 * 1000
    const diffMs = sub.trialEndsAt!.getTime() - before
    // Within 1 second of expected
    expect(diffMs).toBeGreaterThan(expectedMs - 1000)
    expect(diffMs).toBeLessThan(expectedMs + 1000)
  })

  it("sets currentPeriodEnd ~1 month ahead for MONTH interval", async () => {
    const { org, plan } = await setup("MONTH")
    const before = new Date()

    const sub = await createSubscription({ organizationId: org.id, planId: plan.id })

    const expected = new Date(before)
    expected.setMonth(expected.getMonth() + 1)
    // Within 2 seconds
    expect(sub.currentPeriodEnd.getTime()).toBeCloseTo(expected.getTime(), -3)
  })

  it("sets currentPeriodEnd ~1 year ahead for YEAR interval", async () => {
    const { org, plan } = await setup("YEAR")
    const before = new Date()

    const sub = await createSubscription({ organizationId: org.id, planId: plan.id })

    const expected = new Date(before)
    expected.setFullYear(expected.getFullYear() + 1)
    expect(sub.currentPeriodEnd.getTime()).toBeCloseTo(expected.getTime(), -3)
  })

  it("sets currentPeriodEnd far in the future for FREE plans", async () => {
    const { org, plan } = await setup("FREE")

    const sub = await createSubscription({ organizationId: org.id, planId: plan.id })

    const yearsAhead = (sub.currentPeriodEnd.getTime() - Date.now()) / (365 * 24 * 60 * 60 * 1000)
    expect(yearsAhead).toBeGreaterThan(50)
  })

  it("writes an audit log entry on creation", async () => {
    const { org, plan, product } = await setup()
    const actor = await testDb.user.create({
      data: { clerkId: "aud_actor", email: "actor@test.invalid" },
    })

    const sub = await createSubscription({ organizationId: org.id, planId: plan.id }, actor.id)

    const log = await testDb.auditLog.findFirst({
      where: { resourceId: sub.id, action: "subscription.created" },
    })
    expect(log).not.toBeNull()
    expect(log!.actorUserId).toBe(actor.id)
    expect(log!.actorType).toBe("USER")
    expect((log!.metadata as Record<string, unknown>)["productSlug"]).toBe(product.slug)
  })

  it("uses SYSTEM actor when no actorUserId is provided", async () => {
    const { org, plan } = await setup()

    const sub = await createSubscription({ organizationId: org.id, planId: plan.id })

    const log = await testDb.auditLog.findFirst({
      where: { resourceId: sub.id, action: "subscription.created" },
    })
    expect(log!.actorType).toBe("SYSTEM")
    expect(log!.actorUserId).toBeNull()
  })

  it("stores notes on the subscription when provided", async () => {
    const { org, plan } = await setup()

    const sub = await createSubscription({
      organizationId: org.id,
      planId: plan.id,
      notes: "Onboarded via sales call",
    })

    expect(sub.notes).toBe("Onboarded via sales call")
  })
})

// ─── cancelSubscription ───────────────────────────────────────────────────────

describe("cancelSubscription", () => {
  async function createActiveSub() {
    const { org, plan } = await setup()
    const sub = await createSubscription({ organizationId: org.id, planId: plan.id })
    return { org, plan, sub }
  }

  it("immediately sets status to CANCELED when atPeriodEnd=false", async () => {
    const { sub } = await createActiveSub()

    const updated = await cancelSubscription({
      subscriptionId: sub.id,
      atPeriodEnd: false,
      reason: "Customer requested",
    })

    expect(updated.status).toBe("CANCELED")
    expect(updated.canceledAt).not.toBeNull()
    expect(updated.cancelAtPeriodEnd).toBe(false)
  })

  it("sets cancelAtPeriodEnd=true and keeps status ACTIVE when atPeriodEnd=true", async () => {
    const { sub } = await createActiveSub()

    const updated = await cancelSubscription({
      subscriptionId: sub.id,
      atPeriodEnd: true,
      reason: "Downgrading at period end",
    })

    expect(updated.cancelAtPeriodEnd).toBe(true)
    expect(updated.status).toBe("ACTIVE")
    expect(updated.canceledAt).toBeNull()
  })

  it("writes an audit log entry on cancellation", async () => {
    const { sub } = await createActiveSub()

    await cancelSubscription({
      subscriptionId: sub.id,
      atPeriodEnd: false,
      reason: "Test cancellation",
    })

    const log = await testDb.auditLog.findFirst({
      where: { resourceId: sub.id, action: "subscription.canceled" },
    })
    expect(log).not.toBeNull()
    expect((log!.metadata as Record<string, unknown>)["reason"]).toBe("Test cancellation")
  })
})

// ─── updateSubscription ───────────────────────────────────────────────────────

describe("updateSubscription", () => {
  it("changes the planId to the new plan", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const planA = await createTestPlan({ productId: product.id, displayPrice: 4900 })
    const planB = await createTestPlan({ productId: product.id, displayPrice: 9900 })

    const sub = await createSubscription({ organizationId: org.id, planId: planA.id })

    const updated = await updateSubscription({
      subscriptionId: sub.id,
      newPlanId: planB.id,
    })

    expect(updated.planId).toBe(planB.id)
  })

  it("is idempotent: calling twice with the same planId produces same result", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const planA = await createTestPlan({ productId: product.id })
    const planB = await createTestPlan({ productId: product.id })

    const sub = await createSubscription({ organizationId: org.id, planId: planA.id })

    await updateSubscription({ subscriptionId: sub.id, newPlanId: planB.id })
    const second = await updateSubscription({ subscriptionId: sub.id, newPlanId: planB.id })

    expect(second.planId).toBe(planB.id)
  })

  it("writes a subscription.plan_changed audit log", async () => {
    const org = await createTestOrg()
    const product = await createTestProduct()
    const planA = await createTestPlan({ productId: product.id })
    const planB = await createTestPlan({ productId: product.id })

    const sub = await createSubscription({ organizationId: org.id, planId: planA.id })

    await updateSubscription({ subscriptionId: sub.id, newPlanId: planB.id })

    const log = await testDb.auditLog.findFirst({
      where: { resourceId: sub.id, action: "subscription.plan_changed" },
    })
    expect(log).not.toBeNull()
    const meta = log!.metadata as Record<string, unknown>
    expect(meta["previousPlanSlug"]).toBe(planA.slug)
    expect(meta["newPlanSlug"]).toBe(planB.slug)
  })
})
