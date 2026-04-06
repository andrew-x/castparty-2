# Codebase Audit — Implementation Plan

## Context

Full codebase audit across 6 domains found 2 critical security issues, several important improvements, and minor consistency items. This plan addresses all findings the user wants fixed.

## Decisions

- **#7 (autoPromoteToAdmin)**: Skip fix — add explanatory comment instead. The `IS_DEV` guard is sufficient for a dev-only helper.
- **#9 (text-[11px])**: Add a `text-caption-sm` token (0.6875rem / 11px) to `globals.scss` and replace the arbitrary values.

---

## Step 1: Critical Security Fixes

**Subagent:** general-purpose (single agent, both files are related)

### 1a. `src/actions/emails/receive-inbound-email.ts`
- Remove `"use server"` directive. This file is only imported by the route handler — it should be a plain server module, not a callable server action.

### 1b. `src/actions/submissions/send-submission-email.tsx`
- Remove `export` from `sendSubmissionEmail` function (line 29). It's only used within the same file by `sendSubmissionEmailAction` and `sendCustomEmailAction` imports it... let me verify cross-file usage first.
- If imported elsewhere: move the function to a separate non-`"use server"` module.

### 1c. `src/actions/submissions/send-custom-email.ts`
- Check if it imports `sendSubmissionEmail` — if so, the fix needs to account for that.

**Files to read first:** `send-submission-email.tsx`, `send-custom-email.ts`, `receive-inbound-email.ts`, and any importers.

## Step 2: Important Auth & Database Fixes

**Subagent:** general-purpose

### 2a. `src/actions/organizations/get-user-memberships.ts`
- Add `checkAuth()` and verify `userId` matches the authenticated user's ID.

### 2b. `src/actions/productions/add-production-stage.ts`
- Wrap the count check + insert in `db.transaction()`.

### 2c. `src/actions/submissions/get-public-org-profile.ts`
- Move the auto-creation of `OrganizationProfile` to `src/actions/organizations/create-organization.ts` (create the profile row when an org is created).
- Change `getPublicOrgProfile` to a pure read (return null if no profile exists).
- Check downstream callers to handle the null case.

## Step 3: Redundant Query Cleanup

**Subagent:** general-purpose

### 3a. `src/actions/submissions/send-submission-email.tsx`
- Refactor `sendSubmissionEmail` to accept pre-fetched submission data instead of re-querying.
- Update `sendSubmissionEmailAction` to pass the data it already fetched.

### 3b. `src/actions/submissions/send-custom-email.ts`
- Same pattern — pass the pre-fetched submission to avoid double query.

## Step 4: Design Token + Typography Fix

**Subagent:** general-purpose

### 4a. `src/styles/globals.scss`
- Add `--text-caption-sm: 0.6875rem; /* 11px — compact status badges */` and `--text-caption-sm--line-height: 1.45;` between `text-caption` and the spacing section.

### 4b. `src/components/candidates/candidate-card.tsx:81`
- Replace `text-[11px]` with `text-caption-sm`.

### 4c. `src/components/candidates/candidate-detail.tsx:127`
- Replace `text-[11px]` with `text-caption-sm`.

### 4d. Update design system docs
- Add `text-caption-sm` to the typography scale table in `.claude/rules/design-system.md`.

## Step 5: TypeScript & Forms Cleanup

**Subagent:** general-purpose

### 5a. `src/components/productions/feedback-panel.tsx:692`
- Type the `register` parameter properly instead of `any`.

### 5b. `src/components/admin/add-user-dialog.tsx`
- Extract the duplicated schema to `src/lib/schemas/admin.ts` as `createUserFormSchema` / `createUserActionSchema`.
- Update `src/actions/admin/create-user.ts` to import from the shared schema.

### 5c. `src/actions/admin/auto-promote.ts`
- Add a comment explaining why `IS_DEV` is sufficient and why `adminActionClient` is not used here (it's a plain function called programmatically, not a user-facing action).

## Step 6: Minor Fixes

**Subagent:** general-purpose

- `src/lib/logger.ts:5` — rename `dayjs` import to `day`
- `src/lib/schemas/feedback.ts:9` — add `.trim()` to `z.record` values
- `src/lib/schemas/submission.ts:58` — add `.trim()` to `z.record` values
- `src/actions/submissions/update-submission.ts:101-105` — parallelize `checkFileExists()` with `Promise.all`

## Step 7: Lint Autofix

Run `bun run format` to fix the 4 auto-fixable lint issues (CSS class sorting, import ordering).

## Step 8: `action.ts` zod import (already handled)

The librarian already documented `action.ts` as part of the bare `"zod"` exception in Known Issue #10. No code change needed — `next-safe-action`'s `defineMetadataSchema` requires bare zod.

---

## Verification

1. `bun run lint` — should pass clean (0 errors, 0 warnings outside scripts)
2. `bun run build` — should still pass
3. Grep for `"use server"` in `receive-inbound-email.ts` — should be gone
4. Grep for `export.*sendSubmissionEmail` — should not be publicly exported
5. Grep for `text-\[11px\]` — should be zero matches
6. Grep for `text-caption-sm` — should appear in globals.scss + 2 component files

## Items NOT addressed (by design)

- Minor `as` casts on UI event values (4 occurrences) — UI-constrained, safe in practice
- Raw `<button>` in rich-text-editor toolbar — would need Button component refactor
- `db.select()` for auth checks (~8 files) — cosmetic, functionally correct
- `PgTableWithColumns<any>` in slug.ts — Drizzle limitation
- `resolve.ts` return type `any` — contained, biome-suppressed
- Decorative `text-[10rem]` in 404 page — one-off decorative exception
- Script file lint warnings (console usage) — acceptable in scripts
