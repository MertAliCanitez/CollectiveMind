# Next Task

**One task lives here at a time.** When a task is complete, this file is updated to the next item from `backlog.md`. Do not start a second task while this file is populated — finish or explicitly block this one first.

---

## Current Task

**Status:** `[ ]` Not started

**Task:** Admin: create subscription for org

**From backlog:** Active — Internal Operations, item 1

### What to do

Add subscription create + cancel capability to the org detail page at `apps/dashboard/app/(admin)/admin/organizations/[id]/page.tsx`.

**Create subscription:**

1. Add a Server Action `createSubscriptionAction` in `apps/dashboard/app/(admin)/admin/organizations/[id]/_subscription-actions.ts`
   - Auth: `requirePlatformAdmin()`
   - Zod schema: `{ planId: string (required), trialDays: number optional ≥ 0, notes: string optional max 512 }`
   - Guard: before calling `createSubscription()`, check if the org already has an ACTIVE or TRIALING subscription for the same product — reject with an inline error if so
   - On success: call `createSubscription()` from `@repo/billing/src/subscriptions.ts`, then redirect to the same org detail page
   - On validation/conflict error: redirect back with `?error=...` in the query string

2. Add `getDashboardSubscriptionPlans()` or reuse `listPlansForProduct` from `apps/dashboard/lib/admin/plans.ts` to fetch all active plans grouped by product for the plan selector

3. Add the form to the org detail page:
   - Section header: "Add Subscription"
   - Plan selector: `<select>` grouped by product name using `<optgroup>`, showing plan name + billing interval
   - Optional `trialDays` number input (label: "Trial days", placeholder: "0 = active immediately")
   - Optional `notes` textarea (label: "Notes", max 512 chars)
   - Submit button: "Create subscription"
   - Show inline error if `?error` is in the query string

**Cancel subscription:**

4. Add a Server Action `cancelSubscriptionAction(subscriptionId)` in the same actions file
   - Auth: `requirePlatformAdmin()`
   - Calls `cancelSubscription({ subscriptionId, atPeriodEnd: false })` from `@repo/billing`
   - Redirects to the same org detail page

5. Add a "Cancel" button next to each ACTIVE or TRIALING subscription row in the existing subscriptions table on the org detail page

**Data layer:**

6. Add `listAllPlans()` to `apps/dashboard/lib/admin/plans.ts` — returns all ACTIVE plans with their product name and slug, for the plan selector dropdown

**Use `frontend-designer` for all UI work** (form layout, cancel button, error display, section structure on the org detail page).

### Done when

- [ ] Server Action `createSubscriptionAction` validates, guards against duplicates, and calls `@repo/billing`
- [ ] Server Action `cancelSubscriptionAction` cancels immediately
- [ ] Plan selector shows all active plans grouped by product
- [ ] Form shows inline error on duplicate subscription attempt
- [ ] Cancel button appears on ACTIVE/TRIALING subscriptions in the org detail table
- [ ] `requirePlatformAdmin()` is the first call in both actions
- [ ] Type-check and lint pass

### Next task after this

Admin: analytics dashboard (`/admin/analytics` — stat cards for active orgs, subscriptions, per-product counts, ARR/MRR estimate)

---

## How Claude Should Use This File

**Before starting any work:**
Read this file. If a task is listed with status `[~]` (in progress), resume that task — do not start something new.

**When given a new task by the user:**

1. Check if it conflicts with the current task.
2. If yes, surface the conflict and ask which to prioritize.
3. If no, complete the current task first (or mark it blocked with a reason).

**When completing a task:**

1. Mark the task `[x]` in `backlog.md`.
2. Move it to the Done section of `backlog.md`.
3. Update this file with the next task from the backlog.
4. Commit the doc update alongside the code: `docs: complete [task name], advance next-task`.

**When a task is blocked:**

1. Change status to `[!]` and write the blocker inline.
2. Note the blocker in `backlog.md` too.
3. Pull the next unblocked task from the backlog into this file.

---

## Format for This File

```markdown
## Current Task

**Status:** `[~]` In progress

**Task:** [Short task name]

**From backlog:** [Phase] — [Section], item [N]

### What to do

[Concrete steps — precise enough to execute without rereading the backlog]

### Done when

- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]

### Next task after this

[Name of next backlog item]
```
