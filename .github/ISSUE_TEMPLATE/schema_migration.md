---
name: Schema migration
about: Adding, changing, or removing Prisma models or fields
title: "db: "
labels: database, migration
assignees: ""
---

## Change summary

<!-- What is changing in the schema? Add / modify / remove model or field. -->

## Affected models

| Model | Change |
|---|---|
|  |  |

## Migration notes

<!-- Is this a breaking change? Does it require a data backfill? Any deploy ordering requirements? -->

**Breaking:** Yes / No

**Backfill required:** Yes / No — if yes, describe the backfill plan.

**Deploy order:** <!-- e.g. deploy migration before code, or code before migration -->

## Impact on tests

<!-- Does `cleanDatabase()` in `packages/testing/src/helpers/database.ts` need to be updated? -->

- [ ] `cleanDatabase()` updated with new table(s)
- [ ] Test factories updated for new/changed fields
- [ ] Not applicable
