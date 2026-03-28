# Contributing to CollectiveMind

This document describes the branch, commit, and PR workflow for this repository.
It applies to human contributors and to Claude Code-driven development equally.

---

## Branch naming

Every change lives on a branch. Direct commits to `main` are blocked.

| Pattern | When to use | Example |
|---|---|---|
| `feature/<slug>` | New functionality | `feature/webhook-payment-provider` |
| `fix/<slug>` | Bug fix | `fix/grant-expiry-check` |
| `refactor/<slug>` | Structural change with no behaviour change | `refactor/auth-middleware-extract` |
| `chore/<slug>` | Dependency updates, config, tooling | `chore/upgrade-clerk-v7` |
| `docs/<slug>` | Documentation only | `docs/billing-runbook-update` |
| `test/<slug>` | Tests only | `test/entitlement-edge-cases` |
| `db/<slug>` | Schema migrations | `db/add-invoice-pdf-url` |

**Rules:**
- Slug is lowercase, hyphen-separated, ≤ 40 characters
- Branch off `main`
- One concern per branch — do not bundle unrelated changes

---

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```
<type>(<scope>): <summary>

[optional body]

[optional footer(s)]
```

**Types:**

| Type | Use for |
|---|---|
| `feat` | New feature or behaviour |
| `fix` | Bug fix |
| `refactor` | Code change that is neither a fix nor a feature |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Tooling, dependencies, config |
| `db` | Prisma schema or migration changes |
| `perf` | Performance improvement |
| `ci` | CI/CD workflow changes |

**Scopes:** `auth`, `billing`, `admin`, `dashboard`, `web`, `db`, `ui`, `shared`, `config`, `ci`, `hardening`, `testing`

**Examples:**
```
feat(billing): add cancelAtPeriodEnd to subscription state machine
fix(auth): redirect to /home instead of / on access denied
docs(runbooks): add observability guide
db(schema): add ipAddress to AuditLog
ci: add format check job
```

**Rules:**
- Summary is imperative mood, ≤ 72 characters, no trailing period
- Body explains *why*, not *what* (the diff shows the what)
- Reference issues in footer: `Closes #42`

---

## Getting started

```bash
# Clone the repo
git clone https://github.com/MertAliCanitez/CollectiveMind
cd CollectiveMind

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# Start development
pnpm dev
```

See `docs/04-runbooks/local-setup.md` for the full setup walkthrough.

---

## Opening a pull request

1. Create a branch off `main`:
   ```bash
   git checkout main && git pull && git checkout -b feature/my-feature
   ```
2. Make changes, run `pnpm turbo type-check` and `pnpm turbo lint` before committing
3. Push and open a PR against `main`
4. Fill in the PR template — What, Why, Test plan, checklist
5. Keep PRs focused: one concern, one PR
6. Self-review your diff before requesting review

**CI must pass before merge:**
- Lint
- Format
- Type Check
- Prisma Schema
- Tests
- Build

---

## Merging

- Squash merge for feature/fix/docs branches (one clean commit on `main` per PR)
- Delete the source branch after merge

**Squash commit message** — edit GitHub's pre-populated message to follow Conventional Commits:
```
feat(billing): add Stripe webhook processor (#42)
```

---

## Code standards

- **TypeScript strict mode** — no `any`, no `ts-ignore` without a comment explaining why
- **Zod validation** at all system boundaries (Server Actions, webhook routes)
- **No `console.log`** in production code — use `logger` from `@repo/shared`
- **Never log PII** — log IDs only, never names, emails, or payment data
- **All DB queries scoped to `organizationId`** from `auth()` — never from request params
- **No Prisma mocks in tests** — use the real test database with `cleanDatabase()`
- **`orgId` from JWT only** — see `docs/04-runbooks/clerk-auth.md`

---

## Database changes

All schema changes use Prisma Migrate. See `docs/04-runbooks/prisma-migrations.md`.

```bash
# After editing prisma/schema.prisma
pnpm db:migrate           # generate + apply migration in dev
pnpm db:validate          # validate schema without migrating
```

**When adding a new model:** update `cleanDatabase()` in `packages/testing/src/helpers/database.ts`
to include the new table in the TRUNCATE statement.

**Never edit a migration file after it has been committed.**

---

## Running tests

```bash
# All tests
pnpm turbo test

# Single package
pnpm --filter @repo/billing test

# Watch mode
cd packages/billing && pnpm test -- --watch
```

See `docs/04-runbooks/testing.md` for the full test strategy.

---

## Adding a UI component (shadcn/ui)

```bash
# From packages/ui
pnpm dlx shadcn@latest add button
```

Components install to `packages/ui/src/components/` and are re-exported from `packages/ui/src/index.ts`.

---

## Branch protection (GitHub → Settings → Branches → main)

| Rule | Value |
|---|---|
| Require pull request before merging | ✓ |
| Required approving reviews | 1 |
| Dismiss stale reviews on new push | ✓ |
| Require status checks to pass | ✓ |
| Required checks | Lint, Format, Type Check, Prisma Schema, Tests, Build |
| Require branches up to date before merging | ✓ |
| Restrict pushes to main | Admins only |

---

## Claude Code workflow

See `docs/04-runbooks/git-workflow.md` for the complete Claude Code branch/commit/PR protocol.

**Short version:**
1. Branch off `main` with the correct prefix
2. Implement, then `pnpm turbo type-check`
3. Commit with Conventional Commits + `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
4. Push with `git push -u origin <branch>`
5. Report the branch name and a summary of what changed

Claude Code does **not** merge to `main` or open PRs without explicit instruction.
