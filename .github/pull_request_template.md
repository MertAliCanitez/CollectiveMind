## What

<!-- One paragraph: what does this PR do? Lead with the outcome, not the implementation. -->

## Why

<!-- Why is this change needed? Link to issue/ticket if applicable. -->

Closes #<!-- issue number -->

## How

<!-- Optional. Only fill in when the approach is non-obvious or involves a significant design decision. -->

## Test plan

<!-- How was this tested? Check all that apply. -->

- [ ] Unit tests added or updated (`pnpm vitest --filter packages/auth`)
- [ ] Integration tests added or updated (`pnpm turbo test`)
- [ ] Tested manually in local dev
- [ ] No test needed — explain why:

## Checklist

- [ ] `pnpm turbo type-check` passes locally
- [ ] `pnpm turbo lint` passes locally
- [ ] New env vars added to `.env.example` (if any)
- [ ] New Prisma models added to `cleanDatabase()` in `packages/testing/src/helpers/database.ts` (if any)
- [ ] Docs updated if behavior changed (`docs/04-runbooks/`)

## Screenshots / output

<!-- For UI changes, paste a screenshot. For data changes, paste example output. Delete section if not applicable. -->
