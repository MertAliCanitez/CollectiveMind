# Architecture Decision Records

ADRs record significant technical decisions: what was decided, why, and what alternatives were considered. They are append-only — superseded decisions are marked as such rather than deleted.

---

## When to Write an ADR

Write an ADR when a decision:
- Changes a constraint established in `docs/01-architecture/`
- Introduces a new dependency that will be hard to remove
- Affects multiple packages or apps
- Is a non-obvious choice where a future developer might reasonably pick differently
- Supersedes a previous ADR

Do **not** write an ADR for:
- Routine implementation choices that follow established patterns
- Dependency patch/minor version bumps
- Styling or formatting decisions

---

## ADR Template

Copy this template to `docs/03-decisions/adr-NNN-short-title.md` where NNN is the next sequential number (zero-padded to 3 digits: `001`, `002`, ...).

```markdown
# ADR-NNN: [Short Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded by ADR-NNN | Deprecated

## Context

[What situation, constraint, or problem prompted this decision? What forces are at play?
Be specific. Include relevant links to prior art, error logs, or external references.]

## Decision

[State the decision clearly in one or two sentences. What are we doing?]

## Consequences

**Positive:**
- [What does this make easier or better?]

**Negative / trade-offs:**
- [What does this make harder or require us to live with?]

**Risks:**
- [What could go wrong, and how do we mitigate it?]

## Alternatives Considered

### [Alternative 1 name]
[Why wasn't this chosen?]

### [Alternative 2 name]
[Why wasn't this chosen?]

## Implementation Notes

[Optional. If the decision has specific implementation requirements or gotchas, list them here.
This is not a how-to guide — keep it to decision-relevant constraints only.]
```

---

## Existing Architecture Decisions

The following decisions are established in `docs/01-architecture/` and do not require ADRs — they are founding constraints:

| Decision | Where documented |
|----------|-----------------|
| Clerk for auth (no custom auth) | `auth.md` |
| Organizations as tenancy primitive | `auth.md`, `architecture.md` |
| PostgreSQL + Prisma (no raw SQL) | `data-model.md`, `security.md` |
| NullPaymentProvider at v1 | `billing.md` |
| `checkEntitlement()` as billing API surface | `billing.md` |
| Modular monolith (no microservices at v1) | `architecture.md` |
| pnpm + Turborepo monorepo | `repo-structure.md` |
| `organizationId` from JWT only (never user input) | `security.md`, `auth.md` |
| Three-layer authorization (middleware → route → domain) | `security.md` |
| Soft deletes via `deletedAt` | `data-model.md` |
| Money in integer cents | `data-model.md` |
| UUID primary keys | `data-model.md` |

Any change to the above requires both an ADR and an update to the relevant architecture doc.

---

## ADR Index

| # | Title | Status | Date |
|---|-------|--------|------|
| — | *(no ADRs yet — founding constraints documented in architecture docs)* | — | — |

> Add a row here when a new ADR is created.

---

## ADR Lifecycle

```
Proposed → Accepted → [Superseded by ADR-NNN]
                    ↘ [Deprecated]
```

- **Proposed:** Written and under discussion. Not yet in effect.
- **Accepted:** Decision is in effect. Implementation follows from this point.
- **Superseded:** A newer ADR replaces this one. Keep the old ADR; add a link to the new one at the top.
- **Deprecated:** Decision is no longer relevant (e.g. the feature was removed). Keep the ADR as historical record.
