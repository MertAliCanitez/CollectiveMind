# Skill: docs-maintainer

## Purpose

Keep the architecture and technical documentation in `/docs/` accurate and in sync with the actual codebase. Prevents documentation rot — the state where docs describe a system that no longer exists.

## When to Use

Invoke this skill when:
- A significant architectural decision is changed or reversed
- A new domain, package, or app is added to the monorepo
- The database schema changes in a meaningful way (new models, deprecated fields)
- The auth or billing architecture evolves
- A security policy or environment strategy changes
- Post-MVP features are completed and should be reclassified in the roadmap
- A new developer joins and needs current docs to onboard

## What NOT to update

Do not update docs for:
- Bug fixes that don't change architecture
- Component-level changes (new UI components, refactored forms)
- Dependency version bumps
- Code style changes or refactoring within a module
- Adding new API routes that follow existing patterns

Docs describe **why and how the system is structured** — not every file change.

## Rules and Guardrails

**Accuracy over completeness.** A shorter, accurate doc is better than a long, stale one. Delete outdated sections rather than leaving them with a "TODO: update" comment.

**Don't document the obvious.** If something is derivable by reading the code, it doesn't need to be in the architecture docs. Document decisions, constraints, trade-offs, and non-obvious conventions.

**Preserve intent.** When updating a doc, preserve the reasoning behind decisions (the "why") even if the decision itself changed. A new decision's rationale is more valuable than erasing the old one.

**Never rewrite history.** The roadmap reflects current reality and future plans — not past iterations. If a phase is complete, mark it done. Don't remove it.

## Docs Structure Reference

```
docs/
  01-architecture/
    architecture.md    ← product definition, domains, IA, env strategy, observability, MVP scope
    auth.md            ← Clerk patterns, webhook sync, role model, authorization
    billing.md         ← billing domain, provider abstraction, entitlements
    data-model.md      ← Prisma schema, index strategy, migration policy
    repo-structure.md  ← monorepo layout, Turborepo, Git workflow, CI/CD
    security.md        ← threat model, IDOR, secrets, headers
    roadmap.md         ← MVP phases, post-MVP order, scale triggers
  05-prompts/
    skills-overview.md ← this skill system reference
```

## Step-by-Step Working Instructions

### 1. Identify what changed

Before opening any doc file, answer:
- What was the system doing before?
- What is it doing now?
- Why did the decision change?
- Which doc files are affected?

### 2. Locate the affected section

Read the affected doc(s) with `Read`. Identify the exact paragraphs or tables that are now inaccurate. Do not read docs you don't need to change.

### 3. Make minimal, precise edits

Use `Edit` to change only what changed. Do not reformat unrelated sections, do not add new sections speculatively, do not improve prose that is still accurate.

### 4. Update cross-references

Check if other doc files reference the changed section. Search with Grep:

```bash
grep -r "the changed term or concept" docs/
```

Update any cross-references that are now stale.

### 5. Update the roadmap when phases complete

When a phase is completed:
- Change `- [ ]` items to `- [x]`
- Do not remove completed items — they provide historical context
- Add the completion date as a comment if significant: `- [x] Clerk webhook sync _(completed 2026-03-28)_`

### 6. Update MVP vs post-MVP classification

When a post-MVP feature is implemented:
- Move it from the post-MVP list to the appropriate MVP phase (or note it was shipped)
- Update `architecture.md` section 16 if the MVP scope changed materially

## Docs Quality Checklist

Before committing a docs update, verify:

- [ ] The changed section accurately describes current behavior
- [ ] All code examples in the updated section compile against current packages
- [ ] Terminology matches the project glossary (Organization, Member, Plan, etc.)
- [ ] No `TODO`, `FIXME`, or `...` placeholders remain in updated sections
- [ ] Cross-references to updated sections are updated in other files
- [ ] No duplicate information was introduced (same fact stated in two docs)

## Writing Style for Docs

**Tense:** Present tense for current state ("The billing domain owns..."). Future tense for planned features ("Post-MVP, the platform will support...").

**Voice:** Active. "Clerk handles authentication" not "Authentication is handled by Clerk."

**Tables:** Use tables for comparisons, mappings, and lists of items with multiple attributes. Use bullet lists for sequential steps or enumerations without attributes.

**Code blocks:** Always include the file path as a comment at the top of multi-line code blocks:

```ts
// packages/billing/src/entitlements.ts
export async function checkEntitlement(...) { ... }
```

**Decision rationale:** Explain why, not just what. If a pattern is non-obvious, add a brief "Why:" note:

```
**Why separate production Clerk instance:**
A compromised development key cannot affect production users.
```

## When Docs and Code Conflict

Code is the source of truth. Docs describe intent and architecture. If they conflict:

1. Verify the code change was intentional (not a bug)
2. Update the doc to match current code
3. If the code change was unintentional, fix the code instead

Never update docs to match buggy code. The doc should reflect the intended design.
