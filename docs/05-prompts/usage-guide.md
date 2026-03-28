# Claude Code Usage Guide

This guide explains how to work with Claude Code on CollectiveMind effectively and reproducibly. It defines the documentation discipline — what gets updated, when, and by whom — and how to use the custom skill system.

---

## Documentation Is the Product

Docs are not supplementary — they are the system. Claude Code uses docs as working memory across sessions. When docs drift from the code, Claude's output drifts too.

**Rule:** Every session that changes an architectural decision, adds a feature, or completes a backlog item must end with a doc update. Code and docs ship together.

---

## Source of Truth Map

| Question | Answer lives in |
|----------|----------------|
| What is this platform? | `docs/00-product/vision.md` |
| What ships in v1? | `docs/00-product/mvp-scope.md` |
| How is the system architected? | `docs/01-architecture/architecture.md` |
| How does auth work? | `docs/01-architecture/auth.md` |
| How does billing work? | `docs/01-architecture/billing.md` |
| What does the DB schema look like? | `docs/01-architecture/data-model.md` |
| How is the repo structured? | `docs/01-architecture/repo-structure.md` |
| What are the security rules? | `docs/01-architecture/security.md` |
| What's the delivery timeline? | `docs/01-architecture/roadmap.md` |
| What are we building next? | `docs/02-backlog/next-task.md` |
| What's the full work queue? | `docs/02-backlog/backlog.md` |
| Why was X decided? | `docs/03-decisions/` |
| How do I set up locally? | `docs/04-runbooks/local-setup.md` |
| How do I deploy? | `docs/04-runbooks/deploy.md` |
| What skills are available? | `docs/05-prompts/skills-overview.md` |

**If two sources conflict, the architecture docs (`docs/01-architecture/`) win over all others.** Update the other source, not the architecture doc, unless you are deliberately making an architectural change (which requires an ADR).

---

## Starting a New Claude Session

At the start of any session involving code changes, give Claude this context:

```
Read docs/02-backlog/next-task.md and docs/01-architecture/[relevant-doc].md before starting.
```

Or, for the most complete context:

```
Read docs/00-product/vision.md and docs/02-backlog/next-task.md before starting.
```

Claude reads files on demand — it does not have the codebase in memory between sessions. The more relevant docs you point to, the more consistent its output.

---

## Using the Custom Skills

Skills are in `.claude/skills/`. Invoke them with the skill name in your prompt. Each skill carries a full working context — Clerk patterns, Prisma patterns, security rules, etc. — so you don't have to re-explain conventions every session.

### Available Skills

| Skill | Use for |
|-------|---------|
| `/clerk-b2b-auth` | Auth flows, middleware, role checks, webhook handler |
| `/prisma-migrations` | Schema changes, new models, index additions |
| `/billing-architecture` | Entitlement checks, subscription logic, provider work |
| `/admin-crud-patterns` | Admin panel pages, data tables, forms |
| `/frontend-design` | UI components, layouts, responsive design |
| `/saas-ux-copy` | B2B copy, CTAs, empty states, error messages |
| `/landing-page-conversion` | Marketing pages, pricing, hero sections |
| `/seo-content-structure` | Meta tags, structured data, content organization |
| `/observability-sentry` | Logging, error tracking, structured events |
| `/test-strategy` | Vitest tests, test DB setup, factory helpers |
| `/docs-maintainer` | Updating docs after feature work |
| `/branch-workflow` | Branch naming, commit messages, PR flow |

### Example: building the webhook handler

```
/clerk-b2b-auth

Implement the Clerk webhook handler at apps/dashboard/app/api/webhooks/clerk/route.ts.
Verify the Svix signature. Call handleClerkWebhook from @repo/auth.
Follow the auth architecture in docs/01-architecture/auth.md.
```

---

## Documentation Update Rules

### After every feature branch merge

Claude should update:

| What changed | What to update |
|--------------|----------------|
| New DB model or migration | `docs/01-architecture/data-model.md` — add model description |
| New auth pattern or role check | `docs/01-architecture/auth.md` — add pattern |
| New billing entitlement | `docs/01-architecture/billing.md` — add to domain usage |
| New env variable | `docs/04-runbooks/local-setup.md` and `docs/04-runbooks/deploy.md` |
| Feature completed | `docs/02-backlog/backlog.md` — mark `[x]`, advance `next-task.md` |
| Scope decision changed | `docs/00-product/mvp-scope.md` |
| Significant architecture decision | New ADR in `docs/03-decisions/` |

**When in doubt about whether to update docs:** apply this rule — if a future Claude session working on a related feature would benefit from knowing this, write it down.

### The `/docs-maintainer` skill

After completing a non-trivial feature, run:

```
/docs-maintainer

I just completed [feature name]. The changes were: [brief description].
Review what docs need updating and make the changes.
```

This skill knows which files to check and how to keep them consistent.

---

## Architecture Decision Records

Write an ADR when you make a decision that:
- Changes a constraint in `docs/01-architecture/`
- Introduces a dependency that will be hard to remove
- Is non-obvious and a future developer might reasonably reverse

Template: `docs/03-decisions/adr-template.md`

Name files: `docs/03-decisions/adr-001-short-title.md`

**When to write the ADR:** before implementing the decision, not after. The ADR is the alignment point.

---

## Backlog Discipline

### Before starting any session with code output:

1. Read `docs/02-backlog/next-task.md`
2. If a task is marked `[~]` in progress: continue that task
3. If the file is empty or the task is `[ ]` not started: start that task
4. If the user asks for something not on the backlog: check if it's in scope, add it to the backlog in priority order, then work it

### Completing a task:

```
/docs-maintainer

Mark task "[task name]" as complete in docs/02-backlog/backlog.md.
Set the next task in docs/02-backlog/next-task.md to: [next task from backlog].
```

Then commit: `docs: complete [task], advance next-task to [next task]`

---

## Branch and Commit Conventions

From `docs/01-architecture/repo-structure.md`:

**Branch naming:**
```
feature/<scope>-<description>   # new features
fix/<scope>-<description>        # bug fixes
docs/<description>               # documentation only
chore/<description>              # tooling, deps, config
```

**Commit messages (Conventional Commits):**
```
feat(auth): implement Clerk webhook handler
fix(database): resolve prisma generate hoisting
docs(backlog): complete clerk-setup, advance next-task
chore(deps): update next.js to 15.1.0
```

Claude should always:
1. Create a feature branch
2. Commit at logical checkpoints (not one giant commit)
3. Push and report the branch URL

---

## What Claude Should NOT Do

These are established constraints — do not change them without an ADR:

- Do not write raw SQL. Use Prisma only.
- Do not use `req.body` or query params as `orgId`. Always use `auth()` from Clerk.
- Do not add `console.log` in production paths. Use the structured logger.
- Do not add product features outside the current task scope.
- Do not mock the database in tests. Use a real test DB with `cleanDatabase()`.
- Do not skip the three-layer auth check pattern.
- Do not add `"use client"` unless interactivity requires it.
- Do not build payment collection — NullPaymentProvider ships to production at v1.

---

## Reproducibility Checklist

When handing off a feature to another Claude session or team member, verify:

- [ ] Feature branch is pushed
- [ ] All TS errors resolved (run `pnpm turbo type-check`)
- [ ] Lint is clean (`pnpm turbo lint`)
- [ ] Tests pass (`pnpm turbo test`)
- [ ] `next-task.md` is updated
- [ ] Any new env vars are documented in `local-setup.md`
- [ ] Any architectural decisions are in `docs/03-decisions/`
- [ ] PR description explains the "why", not just the "what"

---

## Asking Claude About This Codebase

Good prompts for this project:

```
# Exploring before building
Read docs/01-architecture/auth.md and explain the three-layer authorization model.

# Implementing with full context
/clerk-b2b-auth
Implement [feature]. Use the patterns in auth.md. The current task is in next-task.md.

# Reviewing code
Read apps/dashboard/middleware.ts and check it against the security rules in docs/01-architecture/security.md.

# Updating docs after a feature
/docs-maintainer
I just merged [branch]. Here's what changed: [summary]. Update the relevant docs.

# Making a scope decision
I want to add [feature]. Read mvp-scope.md and tell me if this is in scope, then help me write an ADR if the decision is non-obvious.
```
