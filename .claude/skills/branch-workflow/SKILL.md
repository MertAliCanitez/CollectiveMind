# Skill: branch-workflow

## Purpose

Follow the project's Git branching strategy correctly. Covers branch creation, commit formatting, PR creation, merge procedures, and the hotfix path. Ensures the CI/CD pipeline works and deployment environments stay clean.

## When to Use

Invoke this skill when:
- Starting work on a new feature or fix
- Creating a pull request
- Reviewing the merge path for a change
- Handling a production hotfix
- Resolving a merge conflict
- Unsure whether to target `develop` or `main`

## Branch Model Reference

```
main        ← production-ready at all times. Protected. Deploys to production.
  └── develop  ← integration branch. Protected. Deploys to staging on merge.
        ├── feature/TICKET-123-short-description
        ├── fix/TICKET-456-short-description
        ├── chore/TICKET-789-short-description
        └── docs/update-billing-architecture
```

## Rules and Guardrails

**Always:**
- Branch from `develop` (not `main`) for all feature and fix work
- Target `develop` in all PRs (not `main`) unless it's a hotfix
- Use Conventional Commits format for every commit
- Include a ticket/issue reference in the branch name when one exists
- Squash-merge feature branches into `develop` (keeps history clean)
- Delete the feature branch after merge

**Never:**
- Push directly to `main` or `develop`
- Merge a branch with failing CI
- Force-push to `develop` or `main`
- Create a branch from a stale `develop` — always pull latest first
- Mix multiple unrelated changes in one branch

## Commit Message Format

**Conventional Commits** — format: `type(scope): description`

```
feat(billing): add subscription pause endpoint
fix(auth): handle missing orgId in webhook sync handler
chore(deps): upgrade prisma to 5.15.0
docs(architecture): update billing provider abstraction section
refactor(db): extract subscription queries to repository layer
test(billing): add entitlement check integration tests
perf(admin): add index on audit_log.created_at
ci: add manual approval gate to production deploy
```

**Types:**
| Type | Use when |
|------|----------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `chore` | Maintenance, deps, tooling (no app logic) |
| `docs` | Documentation only |
| `refactor` | Code restructure without behavior change |
| `test` | Adding or fixing tests |
| `perf` | Performance improvement |
| `ci` | CI/CD pipeline changes |
| `style` | Formatting, whitespace (not CSS) |

**Scopes (project-specific):**
`auth`, `billing`, `admin`, `dashboard`, `web`, `db`, `ui`, `email`, `types`, `utils`, `config`, `ci`

**Rules:**
- Description is lowercase, no period at end
- Max 72 characters for the subject line
- Body (optional): blank line after subject, then detail. Use when the "why" isn't obvious.
- Breaking changes: add `!` after scope — `feat(billing)!: change plan slug format`

## Step-by-Step Working Instructions

### Starting a new feature

```bash
# 1. Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# 2. Create your branch
git checkout -b feature/TICKET-123-add-plan-management-page

# 3. Work, commit often with descriptive messages
git add packages/billing/src/plans.ts apps/admin/app/...
git commit -m "feat(billing): add plan list query with pagination"

git add apps/admin/app/(admin)/plans/
git commit -m "feat(admin): add plans list page with search and filters"

# 4. Push and open PR
git push -u origin feature/TICKET-123-add-plan-management-page
```

### Creating a PR

Title format: `[type(scope)] Short description` — matches the commit convention.

```
feat(admin): add plan management CRUD pages
```

PR body template:

```markdown
## What
Brief description of what this PR does.

## Why
Link to ticket or explain the motivation.

## Changes
- Added `plans.ts` query functions in `packages/billing`
- Added `/admin/plans` list + detail + edit pages
- Added Server Actions for plan create/update

## Testing
- [ ] Ran locally, tested create/edit/delete flows
- [ ] Verified empty state renders
- [ ] Checked admin auth gate
- [ ] `pnpm turbo build` passes

## Screenshots (if UI change)
[attach or skip]
```

### Merging to develop

After approval and green CI:
1. Use **Squash and merge** in GitHub UI
2. Edit the squash commit message to match Conventional Commits
3. Delete the feature branch after merge

### Promoting develop → main (release)

```bash
# On GitHub: open PR from develop → main
# Title: "Release: [date or version]"
# Body: summary of what's going in
# Requires: 1 review + all CI green
# After merge: production deploy starts with manual approval gate for DB migration
```

### Hotfix path (production bug)

```bash
# 1. Branch from main (not develop)
git checkout main
git pull origin main
git checkout -b hotfix/TICKET-999-fix-auth-bypass

# 2. Fix, commit
git commit -m "fix(auth): reject requests with tampered orgId claim"

# 3. PR to main — bypasses normal develop → main flow
# After merge to main → triggers production deploy

# 4. Also merge hotfix back to develop
git checkout develop
git merge hotfix/TICKET-999-fix-auth-bypass
# OR cherry-pick if develop has diverged significantly
git cherry-pick <commit-sha>
git push origin develop

# 5. Delete hotfix branch
git branch -d hotfix/TICKET-999-fix-auth-bypass
git push origin --delete hotfix/TICKET-999-fix-auth-bypass
```

### Resolving merge conflicts

```bash
# Rebase on latest develop (preferred over merge for feature branches)
git checkout feature/my-feature
git fetch origin
git rebase origin/develop

# Resolve conflicts in each file, then:
git add <resolved-file>
git rebase --continue

# Push (rebase rewrites history — force push on your own branch is OK)
git push --force-with-lease origin feature/my-feature
```

**Never rebase shared branches** (`develop`, `main`, or any branch someone else is working on).

## CI Gates

A PR cannot merge if any of these fail:

| Check | What it runs |
|-------|-------------|
| `lint` | `pnpm turbo lint` |
| `type-check` | `pnpm turbo type-check` |
| `build` | `pnpm turbo build` |
| `prisma-validate` | `prisma validate` + `prisma format --check` |

All checks must be green. If CI fails:
1. Read the error output
2. Fix locally
3. Push the fix (new commit, not amend — unless it's a trivial typo and the PR hasn't been reviewed)

## Branch Naming Reference

```
feature/TICKET-123-descriptive-name      ← new capability
fix/TICKET-456-what-was-broken           ← bug fix
hotfix/TICKET-789-critical-description   ← prod emergency, branches from main
chore/TICKET-000-what-is-being-done      ← maintenance, deps, tooling
docs/what-is-being-documented            ← docs only (no ticket required)
refactor/what-is-being-restructured      ← structural change, no behavior change
```

If there's no ticket, omit the ticket prefix: `feature/add-org-logo-upload`.
