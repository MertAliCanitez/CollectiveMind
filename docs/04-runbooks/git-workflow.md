# Git Workflow

**Last updated:** 2026-03-28
**Status:** Active — all development follows this workflow.

---

## Overview

```
main  ← production-ready, protected
  ├── feature/customer-dashboard
  ├── feature/billing-webhooks
  ├── fix/grant-expiry-check
  └── docs/observability-runbook
```

- `main` is the only long-lived branch. No `develop`, no `staging` branch.
- Every change lands via a PR from a short-lived topic branch.
- CI must be green before merge.

---

## Branch lifecycle

### 1. Create

Always branch from current `main`:

```bash
git checkout main
git pull --ff-only
git checkout -b feature/my-feature
```

**Naming rules** — see `CONTRIBUTING.md` for the full table:

| Type                | Pattern           |
| ------------------- | ----------------- |
| New functionality   | `feature/<slug>`  |
| Bug fix             | `fix/<slug>`      |
| Structural refactor | `refactor/<slug>` |
| Tests only          | `test/<slug>`     |
| Docs only           | `docs/<slug>`     |
| Schema change       | `db/<slug>`       |
| Tooling / deps      | `chore/<slug>`    |

### 2. Work

Make focused commits. Keep each commit coherent — a reviewer should be able to understand it in isolation.

```bash
git add packages/billing/src/subscriptions.ts
git commit -m "feat(billing): add cancelAtPeriodEnd flag to cancel flow"
```

**Commit format:**

```
<type>(<scope>): <imperative summary, ≤72 chars>

[body: why this change, not what it does — the diff shows the what]

[footer: Closes #42]
[footer: Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>]
```

Run checks before committing:

```bash
pnpm turbo type-check
pnpm turbo lint
```

### 3. Push

```bash
git push -u origin feature/my-feature
```

If you need to update after review feedback:

```bash
# Add more commits — do not force-push a shared branch
git add .
git commit -m "fix(billing): handle null planId on cancel"
git push
```

### 4. Open a pull request

```bash
gh pr create \
  --base main \
  --title "feat(billing): add cancel-at-period-end flow" \
  --body "$(cat .github/pull_request_template.md)"
```

Or use the GitHub UI. The PR template will auto-populate.

**PR checklist before marking ready:**

- [ ] All CI checks pass
- [ ] PR description is filled in (What / Why / Test plan)
- [ ] New env vars are in `.env.example`
- [ ] New Prisma models added to `cleanDatabase()`
- [ ] Self-reviewed the diff

### 5. Merge

After approval and green CI:

- Use **Squash and merge** on GitHub
- Edit the squash commit message to follow Conventional Commits:
  ```
  feat(billing): add cancel-at-period-end flow (#87)
  ```
- Delete the source branch after merge (GitHub can do this automatically)

---

## Keeping a branch up to date

If `main` has moved ahead of your branch, rebase (don't merge):

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease origin feature/my-feature
```

`--force-with-lease` is safe: it only force-pushes if nobody else has pushed to the branch since your last fetch. Never use `--force` on a shared branch.

---

## Hotfix workflow

A hotfix is a `fix/` branch that goes directly from `main` → PR → merge, same as any other change. There is no separate hotfix branch type.

If the fix is urgent:

1. Create `fix/<slug>` from `main`
2. Implement the minimum fix
3. Open the PR and mark it as urgent in the description
4. Merge after CI passes (consider whether to require review based on severity and risk)

---

## CI checks

The CI pipeline runs on every PR to `main` and on pushes to `main`. Jobs:

| Job           | What it checks                                      | Required |
| ------------- | --------------------------------------------------- | -------- |
| Lint          | ESLint across all packages                          | Yes      |
| Format        | Prettier formatting                                 | Yes      |
| Type Check    | TypeScript `--noEmit` across all packages           | Yes      |
| Prisma Schema | `prisma validate` — schema is internally consistent | Yes      |
| Tests         | Unit + integration tests with real Postgres         | Yes      |
| Build         | Full monorepo build (`turbo build`)                 | Yes      |

**If CI fails:** fix it before requesting review. Do not ask reviewers to approve a red PR.

To reproduce CI failures locally:

```bash
pnpm turbo lint
pnpm format:check
pnpm turbo type-check
pnpm turbo test          # requires TEST_DATABASE_URL
pnpm turbo build
```

---

## Claude Code protocol

When Claude Code implements a feature, it follows these steps in order:

### Step 1 — Branch

```bash
git checkout main && git pull --ff-only
git checkout -b feature/<slug>
```

Claude Code always branches from current `main` unless the task explicitly requires stacking on another branch.

### Step 2 — Implement

Claude Code reads existing code before modifying it. It does not add features beyond what was asked.

### Step 3 — Type check

```bash
pnpm turbo type-check
```

Claude Code does not commit code with type errors.

### Step 4 — Commit

Claude Code commits with Conventional Commits and includes a `Co-Authored-By` trailer:

```bash
git commit -m "$(cat <<'EOF'
feat(billing): add cancel-at-period-end subscription flow

Implements the atPeriodEnd path in cancelSubscription(). When true,
sets cancelAtPeriodEnd=true and keeps status ACTIVE until the
current period expires.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

### Step 5 — Push

```bash
git push -u origin feature/<slug>
```

### Step 6 — Report

Claude Code reports:

- Branch name
- Summary of what changed and why
- Any follow-up actions (e.g., env vars to add, migrations to run)
- Files changed (grouped by concern)

Claude Code does **not** open PRs or push to `main` unless the user explicitly asks.

### When the user says "open a PR"

```bash
gh pr create \
  --base main \
  --title "<type>(<scope>): <summary>" \
  --body "$(cat <<'EOF'
## What
<what the PR does>

## Why
<motivation>

## Test plan
- [ ] Type check passes
- [ ] Tests pass

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Branch protection settings

These rules should be configured in **GitHub → Repository → Settings → Branches → Add rule → `main`**:

```
Branch name pattern: main

☑ Require a pull request before merging
  Required approving reviews: 1
  ☑ Dismiss stale reviews when new commits are pushed

☑ Require status checks to pass before merging
  ☑ Require branches to be up to date before merging
  Status checks:
    - Lint
    - Format
    - Type Check
    - Prisma Schema
    - Tests
    - Build

☑ Do not allow bypassing the above settings
  (Administrators can bypass only in a declared emergency)

☑ Restrict who can push to matching branches
  → Only repository admins
```

**Why these rules:**

- Required reviews prevent solo merges — at least one other set of eyes
- Status checks block broken code from reaching production
- "Up to date" prevents merge races where individual branch CI passed but the combination breaks
- Dismissing stale reviews ensures approval is current after code changes

---

## Stale branches

Branches that have been merged should be deleted immediately (GitHub can automate this).

For unmerged branches older than 30 days with no activity, either:

- Rebase and revive if the work is still needed
- Delete if the work has been superseded

Check stale branches:

```bash
git fetch --prune
git branch --merged main | grep -v main
```

---

## What not to do

- **Do not commit to `main` directly.** Branch protection enforces this, but don't try to bypass it.
- **Do not force-push to shared branches.** Use `--force-with-lease` if you must rewrite history, and only before anyone has based work on your branch.
- **Do not merge with failing CI.** If a check is flaky, fix the flakiness — don't merge past it.
- **Do not squash away `Co-Authored-By` trailers.** They identify AI-assisted commits for audit purposes.
- **Do not use `git commit --no-verify`.** Pre-commit hooks exist for a reason.
- **Do not mix schema migrations with application code in the same PR** unless they are tightly coupled and must deploy together. When they must deploy together, document the deploy order in the PR description.
