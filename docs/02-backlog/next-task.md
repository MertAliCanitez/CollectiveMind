# Next Task

**One task lives here at a time.** When a task is complete, this file is updated to the next item from `backlog.md`. Do not start a second task while this file is populated — finish or explicitly block this one first.

---

## Current Task

**Status:** `[ ]` Not started

**Task:** Clerk dev instance setup

**From backlog:** Phase 1 — Auth & Organizations, item 1

### What to do

This is an ops task, not a code task. No files to create.

1. Log in to [clerk.com/dashboard](https://clerk.com/dashboard)
2. Create a new Application — name it "CollectiveMind Dev"
3. Enable **Organizations** in the Clerk dashboard (under Configure → Organizations)
4. Add a custom session claim:
   - Go to Configure → Sessions → Edit → Customize session token
   - Add: `{ "platformRole": "{{user.public_metadata.platformRole}}" }`
5. Create a webhook endpoint:
   - Go to Webhooks → Add Endpoint
   - URL: `https://<your-ngrok-or-tunnel-url>/api/webhooks/clerk`
   - Subscribe to events: `user.*`, `organization.*`, `organizationMembership.*`
   - Copy the **Signing Secret**
6. Copy the following values to `apps/dashboard/.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Done when

- [ ] Clerk dev application exists and Organizations are enabled
- [ ] Session claim `platformRole` is configured
- [ ] Webhook endpoint exists pointing to local tunnel
- [ ] `.env.local` is populated (never committed)

### Next task after this

Dashboard app: Clerk provider + middleware (Phase 1, item 2)

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
