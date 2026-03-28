# Skill: saas-ux-copy

## Purpose

Write all user-facing text for the platform: UI microcopy, CTAs, empty states, error messages, onboarding prompts, tooltips, and confirmation dialogs. Ensures the platform speaks with a consistent, clear, B2B-appropriate voice across all three apps.

## When to Use

Invoke this skill when:
- Writing or reviewing text for any UI element
- Designing empty states, error pages, or confirmation flows
- Crafting onboarding steps, tooltips, or helper text
- Writing marketing copy for `apps/web` landing and product pages
- Reviewing a page for copy consistency before shipping

## Tone and Voice Principles

**For `apps/dashboard` and `apps/admin` (product UI):**
- **Clear over clever.** Never sacrifice comprehension for wit.
- **Direct.** Address the user with "you" and "your." Use active voice.
- **Calm under error.** Error messages explain what happened and what to do next — never blame the user.
- **Concise.** Every word must earn its place. Cut qualifiers ("just", "simply", "easily").
- **Professional but human.** B2B does not mean robotic. Write as a knowledgeable colleague, not a manual.

**For `apps/web` (marketing):**
- **Benefit-led.** Lead with outcome, follow with feature.
- **Confident, not arrogant.** Specific claims over vague superlatives.
- **Action-oriented.** CTAs describe what happens when clicked, not a generic action.

## Rules and Guardrails

**Never write:**
- "Something went wrong." — Explain what went wrong.
- "Error 500" as user-facing copy — Translate technical errors to human language.
- "Click here" — Describe the destination or action.
- "Please" in error messages — It sounds apologetic; be helpful instead.
- "Loading..." as the only loading state message — Add context: "Loading your team members..."
- Exclamation marks in errors or warnings.
- ALL CAPS for emphasis — use `font-semibold` or `<strong>` in UI.
- Vague CTAs: "Submit", "OK", "Yes" — always use specific action verbs.

**Always include:**
- An empty state for every list or data view
- A success state or confirmation for every form submission
- A recovery path in every error message (what to do next)
- Tooltip/helper text for any field that is non-obvious

## Step-by-Step Working Instructions

### 1. Identify the context

Before writing copy, establish:
- **Who is reading this?** (New user? Org admin? Billing manager? Internal staff?)
- **What just happened?** (Action succeeded? Failed? Nothing yet?)
- **What do they need to do next?** (Confirm? Retry? Contact support? Do nothing?)

### 2. Map the copy type to a pattern

| Copy type | Pattern |
|-----------|---------|
| Page title | Noun phrase describing the page content — "Team Members", "Billing & Plans" |
| Section heading | What the section contains — "Active Subscriptions", "Recent Activity" |
| CTA (primary) | Verb + object — "Invite Member", "Upgrade Plan", "Create Organization" |
| CTA (destructive) | Verb + object (no "Are you sure?" in the button) — "Remove Member", "Cancel Subscription" |
| Empty state title | What's missing, stated plainly — "No members yet" |
| Empty state description | Why it matters + action prompt |
| Inline error | What's wrong + how to fix it — "Email already in use. Try signing in instead." |
| Toast (success) | Past-tense action — "Member invited", "Plan updated" |
| Toast (error) | What failed + next step — "Couldn't send invite. Check the email and try again." |
| Confirmation dialog | Specific consequences, not generic warnings |
| Tooltip | One sentence, no punctuation at end unless multiple sentences |

### 3. Write the copy

Draft the primary copy, then apply the compression test: remove every word that doesn't change the meaning. The remainder is the copy.

### 4. Write the fallback / edge case copy

For every happy path copy, write:
- The error state (what if this action fails?)
- The empty state (what if there's no data?)
- The loading state (what does the user see while waiting?)

### 5. Check consistency

Verify the copy uses the same terminology used elsewhere in the product:
- "Organization" not "workspace", "team", or "account"
- "Member" not "user" or "teammate"
- "Plan" not "tier" or "package"
- "Product" not "app" or "tool"
- "Subscription" not "license" or "access"

## Project-Specific Conventions

### Terminology glossary

| Use | Not |
|-----|-----|
| Organization | Workspace, Team, Account, Company |
| Member | User, Teammate, Collaborator |
| Plan | Tier, Package, License |
| Product | App, Tool, Module |
| Subscription | License, Access, Membership |
| Invite | Add, Register |
| Remove (a member) | Delete, Kick, Ban |
| Cancel (a subscription) | Delete, End, Remove |
| Admin | Administrator, Owner, Super user |
| Dashboard | Home, Portal, Console |

### Destructive action confirmation dialogs

Always name the specific thing being destroyed:

```
Title:   Remove Sarah Chen?
Body:    Sarah will lose access to all products in Acme Inc.
         This cannot be undone.
Cancel:  Keep member
Confirm: Remove member  [destructive variant button]
```

Not:
```
Title:   Are you sure?
Body:    This action cannot be undone.
Confirm: Yes
```

### Empty state structure

```
[Icon — 48px, muted color]
[Title — "No [thing] yet"]
[Description — 1-2 sentences: what this section is for + how to add the first one]
[Primary CTA — if the user can take action from here]
```

Examples:
```
No team members yet
Invite your colleagues to collaborate on products in Acme Inc.
[Invite member]
```

```
No active subscriptions
Your organization hasn't activated any products yet. Browse available products to get started.
[View products]
```

### Error message structure

```
[What failed]: [Why, if known]. [What to do next].
```

Examples:
```
Couldn't send invitation. That email address already has a pending invite.
```
```
Plan change failed. Your payment method was declined. Update your billing details to continue.
```
```
Session expired. Sign in again to continue where you left off.
```

### Loading state copy

Match the loading message to the action:
```
"Loading your team..."       not "Loading..."
"Saving changes..."          not "Please wait..."
"Sending invitation..."      not "Submitting..."
"Canceling subscription..."  not "Processing..."
```

## Examples

### Onboarding step copy

```
Step 1 of 3
Create your organization

Your organization is the home for your team and subscriptions.
You can change the name and invite members after setup.

[Organization name]
[Continue →]
```

### Upgrade prompt (non-functional at v1)

```
This feature is on the Pro plan

Get unlimited API access, priority support, and advanced analytics.
Talk to us to upgrade — we'll get you set up.

[Contact us]        [See all plans]
```

### Trial expiry warning (dashboard banner)

```
Your trial ends in 3 days
To keep access to Product A, upgrade to a paid plan or contact us.
[Upgrade plan]  [Dismiss]
```

### Settings section: danger zone

```
Cancel subscription
Once canceled, your team will lose access to Product A at the end of the current billing period.
[Cancel subscription]  ← outlined destructive button, not filled
```
