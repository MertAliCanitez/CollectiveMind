# Contributing to CollectiveMind

## Branch Workflow

All development happens on feature branches targeting `develop`. See the [`branch-workflow`](.claude/skills/branch-workflow/SKILL.md) skill for the full workflow.

```
main       ← production
  └── develop  ← integration (PRs target this)
        ├── feature/TICKET-123-short-name
        ├── fix/TICKET-456-short-name
        └── chore/short-name
```

## Getting Started

```bash
# Fork and clone
git clone https://github.com/YOUR_FORK/CollectiveMind
cd CollectiveMind

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start database
docker compose up -d

# Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Start development
pnpm dev
```

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

```
feat(scope): add new feature
fix(scope): fix a bug
chore(scope): maintenance task
docs(scope): documentation update
refactor(scope): code restructure
test(scope): add or fix tests
perf(scope): performance improvement
ci: CI/CD changes
```

**Scopes:** `auth`, `billing`, `admin`, `web`, `db`, `ui`, `shared`, `config`, `ci`

## Pull Request Process

1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Make your changes and commit with Conventional Commits
3. Open a PR targeting `develop`
4. Ensure all CI checks pass
5. Request review from a team member
6. Squash-merge after approval

## Code Standards

- **TypeScript strict mode** — no `any`, no `ts-ignore` without explanation
- **Zod validation** at all system boundaries (API routes, Server Actions, env vars)
- **No `console.log`** in production code — use the `logger` from `@repo/shared`
- **Never log PII** — log IDs only, never names, emails, or payment data
- **All DB queries scoped to `organizationId`** — never return cross-tenant data
- **No Prisma mocks** in tests — use the real test database with cleanup helpers

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @repo/billing test

# Watch mode
pnpm --filter @repo/billing test -- --watch
```

## Database Changes

All schema changes must use Prisma Migrate. See the [`prisma-migrations`](.claude/skills/prisma-migrations/SKILL.md) skill.

```bash
# After editing prisma/schema.prisma
pnpm db:migrate  # generates + applies migration
```

**Never edit a migration file after it has been committed.**

## Adding a shadcn/ui Component

```bash
# From the packages/ui directory
pnpm dlx shadcn@latest add button
```

Components are installed to `packages/ui/src/components/` and re-exported from `packages/ui/src/index.ts`.
