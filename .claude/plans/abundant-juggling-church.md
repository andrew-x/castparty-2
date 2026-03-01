# Castparty Codebase Audit: Findings & Remediation Plan

## Context

This is a comprehensive audit of the Castparty codebase covering: code quality, convention compliance, security, data integrity, documentation drift, and consistency. The goal is to identify everything that needs attention, prioritized by impact.

**Constraints:** The Neon HTTP driver (`neon-http`) does not support interactive transactions. Fixes that originally proposed `db.transaction()` are redesigned to use sequential operations with appropriate guards instead.

---

## Part 1: Code Bugs & Data Integrity Issues

### CRITICAL: Non-atomic ownership transfer (two owners possible)
- **File:** `src/actions/organizations/transfer-ownership.ts:56-64`
- **Problem:** Two separate `db.update()` calls set the new owner and demote the old owner. If the first succeeds but the second fails, the org has **two owners**. No transactions available with neon-http driver.
- **Fix:** Reorder operations so the safer failure mode occurs: demote the caller first (line 61-64), then promote the target (line 56-59). If the second call fails, no one is owner (recoverable by re-running) rather than two owners. Add a try/catch to attempt rollback of the first operation if the second fails.

### CRITICAL: Infinite loop in role slug generation
- **File:** `src/actions/productions/create-production.ts:52-54`
- **Problem:** The `while (usedSlugs.has(slug))` loop calls `nameToSlug(role.name)` which generates a new CUID suffix each time. While CUID collisions are extremely unlikely, the bigger issue is: if two roles have identical names, the CUID suffix makes them unique already — the while loop is unnecessary but harmless. However, theoretically it could loop if CUID somehow repeated.
- **Fix:** Remove the while loop entirely. `nameToSlug()` already appends a random 8-char CUID suffix, making in-memory collisions vanishingly unlikely. The `usedSlugs` set check can remain as a single `if` guard with a counter fallback for safety.

### HIGH: Stage removal orphans submissions when inbound stage missing
- **File:** `src/actions/productions/remove-pipeline-stage.ts:43-56`
- **Problem:** If `inboundStage` is not found (line 43-46), the `if (inboundStage)` guard at line 49 skips reassignment but still deletes the stage at line 56. Submissions on that stage get `stageId = null` (set null cascade). This is a silent data loss.
- **Fix:** Throw an error if inbound stage is not found rather than silently proceeding. The inbound stage is a system stage and should always exist — its absence indicates a corrupt pipeline.

### HIGH: StatusChange audit trail lost on user deletion
- **File:** `src/lib/db/schema.ts:356-358`
- **Problem:** `changedById` has `onDelete: "cascade"`. If a user account is deleted, all their status change audit records are deleted, destroying the audit trail.
- **Fix:** Change to `onDelete: "set null"` and make `changedById` nullable, so audit records survive user deletion.

### HIGH: Candidate name mismatch on reuse
- **File:** `src/actions/submissions/create-submission.ts:56-76`
- **Problem:** When an existing candidate is found by email (line 64-65), their `firstName`/`lastName` from the original submission are kept. If the same email submits with a different name, the candidate record and submission data diverge silently.
- **Fix:** When reusing a candidate, update their name/phone to the latest submission values.

### MEDIUM: Missing candidate uniqueness constraint
- **File:** `src/lib/db/schema.ts:305-318`
- **Problem:** No unique constraint on `(organizationId, email)` for the Candidate table. The code handles dedup at the application level (create-submission.ts:57-59), but without a DB constraint, concurrent submissions could create duplicate candidates.
- **Fix:** Add `uniqueIndex("candidate_org_email_uidx").on(table.organizationId, table.email)`.

### MEDIUM: Terminal stage transitions not prevented
- **File:** `src/actions/submissions/update-submission-status.ts:42-50`
- **Problem:** No check prevents moving a submission FROM a terminal stage (Cast/Rejected). Once a candidate is cast or rejected, they can still be moved to any other stage. Pipeline semantics suggest terminal stages should be final.
- **Fix:** Load the current stage's `isTerminal` flag and reject the transition if true.

### MEDIUM: Stale org fallback in checkAuth
- **File:** `src/lib/auth/auth-util.ts:15-25`
- **Problem:** If `activeOrganizationId` is present in the session but the org has been deleted or the user's membership removed, the stale ID is returned without validation. The fallback only triggers when `orgId` is null.
- **Fix:** When `orgId` is present from the session, verify the user still has a membership for that org. If not, fall through to the membership lookup.

### MEDIUM: Error messages may leak implementation details
- **File:** `src/lib/action.ts:11-18`
- **Problem:** The `publicActionClient` error handler returns `e.message` for all `Error` instances. Unexpected errors (DB failures, internal assertions) leak their raw message to the client.
- **Fix:** Distinguish between expected user-facing errors and unexpected errors. Return `DEFAULT_SERVER_ERROR_MESSAGE` for unexpected errors.

---

## Part 2: Convention Violations

### Native `Date` usage (should use dayjs wrapper)
3 files use `new Date()` in action code instead of `day().toDate()`:
1. `src/actions/organizations/invite-member.ts:91` — `createdAt: new Date()`
2. `src/actions/productions/remove-pipeline-stage.ts:52` — `updatedAt: new Date()`
3. `src/actions/submissions/update-submission-status.ts:54` — `updatedAt: new Date()`

**Fix:** Import `day` from `@/lib/dayjs` and replace `new Date()` with `day().toDate()`.

**Note:** The `new Date()` calls in `src/lib/db/schema.ts` (column `$onUpdate` callbacks) are acceptable — these are Drizzle column definitions, not application logic.

### No other convention violations found
The audit checked all 10 convention areas and the codebase is otherwise exemplary:
- No raw HTML elements (all use common components)
- No raw Tailwind colors, spacing, or typography
- All `z.string()` schemas have `.trim()` where appropriate
- All `"use client"` directives are justified
- No emoji or exclamation marks in UI copy
- Domain terminology is correct throughout

---

## Part 3: Documentation Drift

### docs/FEATURES.md — Missing features and incorrect references

| Issue | Detail |
|-------|--------|
| **Missing: Candidates List** | Feature exists at `src/app/(app)/candidates/page.tsx` — not in the inventory table |
| **Missing: Public Submission Flow** | `/submit/[orgSlug]/[productionSlug]/[roleSlug]` — significant feature, not documented |
| **Missing: Production Settings** | `src/app/(app)/productions/[id]/settings/page.tsx` — not documented |
| **Missing: URL Slugs** | Slug generation system (`src/lib/slug.ts`) — not documented |
| **Missing: Pipeline Stages** | Configurable pipeline with system stages — not documented |
| **Missing: Organization Switcher** | Multi-org switching via `OrgSwitcher` component — not documented |
| **Wrong nav label (line 126)** | Says "Performers" but code uses "Candidates" (`app-sidebar.tsx:41`) |
| **Wrong CTA link (line 16, 188)** | Says "link to /dashboard" but code links to `/auth` (`page.tsx:28`) |
| **Dark mode contradiction (line 64)** | Says "dark mode intentionally not supported" but `globals.scss:185-194` has `.dark` class variables |

### docs/ARCHITECTURE.md — Stale paths and missing details

| Issue | Detail |
|-------|--------|
| **Wrong globals.scss path (line 27)** | Shows `src/app/globals.scss` but actual location is `src/styles/globals.scss` |
| **Feature directories listed as "future" (line 46)** | Says `src/components/productions/` etc. are "future" but they already exist |
| **Missing: Better Auth plugins** | Doesn't document `adminPlugin()`, `organizationPlugin()`, `nextCookies()` |
| **Dark mode mentioned (line 54)** | Says "Dark mode via `prefers-color-scheme`" — contradicts FEATURES.md; actual `.dark` class is shadcn sidebar default, not media query |
| **Missing: Database section** | No mention of Drizzle schema, migrations, or the relational API patterns |
| **Missing: Submission data model** | Core casting data (Candidate, Submission, StatusChange, PipelineStage) not described |

### docs/CONVENTIONS.md — Minor gaps
- Button `href` prop capability not documented
- Button-in-server-component restriction may be outdated (landing page uses `<Button href="/auth">` in a server component successfully)

### docs/DECISIONS.md — Missing ADRs
- No ADR for: design system token architecture, public submission flow, URL slug routing, Better Auth organization plugin choice, pipeline stage system design

---

## Part 4: Remediation Plan

### Phase 1: Code Fixes (8 issues)

**Batch A — Independent action file fixes (parallel):**

1. **Fix transfer-ownership ordering** (`src/actions/organizations/transfer-ownership.ts`)
   - Reorder: demote caller first, promote target second
   - Add try/catch with rollback attempt on second failure

2. **Fix remove-pipeline-stage inbound guard** (`src/actions/productions/remove-pipeline-stage.ts`)
   - Replace `if (inboundStage)` with a throw if missing
   - Also fix `new Date()` → `day().toDate()` (convention fix)

3. **Fix create-production slug loop** (`src/actions/productions/create-production.ts`)
   - Remove `while` loop, use single `nameToSlug()` call with `if` guard + counter fallback

4. **Fix candidate reuse: update name on resubmission** (`src/actions/submissions/create-submission.ts`)
   - When existing candidate found, update their firstName/lastName/phone to latest values

5. **Add terminal stage guard + fix Date** (`src/actions/submissions/update-submission-status.ts`)
   - Load current stage `isTerminal` flag, reject if true
   - Fix `new Date()` → `day().toDate()`

6. **Fix invite-member Date** (`src/actions/organizations/invite-member.ts`)
   - Fix `new Date()` → `day().toDate()` on line 91

**Batch B — Schema + lib fixes (parallel):**

7. **Schema fixes** (`src/lib/db/schema.ts`)
   - Add `uniqueIndex("candidate_org_email_uidx")` on Candidate table
   - Change `StatusChange.changedById` to `onDelete: "set null"`, make nullable
   - Note: User handles migration generation separately

8. **Validate active org in checkAuth** (`src/lib/auth/auth-util.ts`)
   - When `orgId` present, verify membership exists before returning

9. **Sanitize error handling** (`src/lib/action.ts`)
   - Return `DEFAULT_SERVER_ERROR_MESSAGE` for unexpected errors, only pass through intentional user-facing messages

### Phase 2: Documentation Updates (delegate to librarian)

10. **Update docs/FEATURES.md** — Add 6 missing features, fix nav label, fix CTA link, clarify dark mode
11. **Update docs/ARCHITECTURE.md** — Fix paths, update component directories, add Better Auth plugins, add database section
12. **Update docs/CONVENTIONS.md** — Document Button href prop, clarify server component restriction
13. **Update docs/DECISIONS.md** — Add missing ADRs

Subagent: Librarian agent for all doc updates.

### Verification

After all code changes:
1. `bun run lint` — ensure no Biome violations introduced
2. `bun run build` — ensure production build succeeds

### Execution Strategy

- **Phase 1 Batch A** (6 action file fixes): Dispatch parallel subagents — each file is independent
- **Phase 1 Batch B** (3 lib fixes): Dispatch parallel subagents — each file is independent
- **Phase 2** (docs): Single librarian subagent with all doc updates
- **Verification**: Run lint and build after all phases complete
