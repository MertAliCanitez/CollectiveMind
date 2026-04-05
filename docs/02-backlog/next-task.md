# Next Task

**One task lives here at a time.** When a task is complete, this file is updated to the next item from `backlog.md`. Do not start a second task while this file is populated — finish or explicitly block this one first.

---

## Current Task

**Status:** `[~]` No active MVP task

**Task:** —

**From backlog:** All MVP items are complete. Remaining work is Phase 4 hardening and post-MVP features, both of which require external input or explicit decisions before proceeding.

### What to do

No implementation work is in flight.

**Phase 4 options (can be started without external input):**
- Security headers (`Content-Security-Policy`, `X-Frame-Options`, etc.) in `next.config.ts` — self-contained, no external deps
- Load test baseline — requires k6 or similar tooling decision

**Phase 4 options requiring your input first:**
- Sentry setup — requires Sentry project + `NEXT_PUBLIC_SENTRY_DSN`
- Staging environment — requires deployment target decision (Vercel project, DB branch, Clerk instance)

**Post-MVP options requiring your input first:**
- Live payment integration — requires provider selection (Stripe / Paddle / iyzico / other) and credentials
- Product workspace content — requires product spec (what do Insights, Connect, Workspace actually do?)

### Done when

N/A — no task in flight.

### Next task after this

Whichever Phase 4 or post-MVP item you greenlight next.

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
