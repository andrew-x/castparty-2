# Plan: Submission Deduplication

## Context

The public submission form allows duplicate submissions to the same role. This plan
adds a check-on-submit flow: detect existing submissions by email, warn the user via
a dialog, and update existing submissions (preserving stage) while creating new ones.

Full spec: `docs/superpowers/specs/2026-04-03-submission-dedupe-design.md`

## Steps

### 1. Schema + index

- Add `confirmUpdate: z.boolean().default(false)` to `submissionActionSchema` in
  `src/lib/schemas/submission.ts`
- Add composite index on `Submission(candidateId, roleId)` in `src/lib/db/schema.ts`
- Run migration

**Files**: `src/lib/schemas/submission.ts`, `src/lib/db/schema.ts`

### 2. Server read: `checkSubmissionDuplicates`

- New file `src/actions/submissions/check-submission-duplicates.ts`
- Plain `"use server"` async function
- Looks up Candidate by `(orgId, email)`, queries Submissions for matching roleIds
- Returns `{ duplicates: Array<{ roleId, roleName, submissionId }> }`

**Agent**: Implement directly (small, focused function)

### 3. Server write: enhance `createSubmission`

- After candidate upsert, query existing submissions for `(candidateId, roleIds)`
- Partition into existing vs new
- If duplicates exist and `confirmUpdate` is false, throw error
- If `confirmUpdate`: UPDATE existing (preserve stageId), DELETE old Files + INSERT
  new Files, INSERT new Submissions
- Return `{ created, updated }` alongside IDs
- Only send confirmation emails for new submissions

**File**: `src/actions/submissions/create-submission.ts`
**Agent**: Implement directly (careful modification of existing action)

### 4. Dialog component

- New file `src/components/submissions/duplicate-warning-dialog.tsx`
- Uses `AlertDialog` from `@/components/common/alert-dialog`
- Shows which roles are duplicates, explains update behavior

**Agent**: Implement directly

### 5. Form integration

- Modify `src/components/submissions/submission-form.tsx`
- Add state for pending values, duplicate roles, dialog open
- In submit handler: call `checkSubmissionDuplicates` after validation, before
  file upload
- Extract file-upload + execute into `proceedWithSubmission` helper
- Wire dialog confirm to call `proceedWithSubmission({ confirmUpdate: true })`
- Update success message to differentiate created vs updated

**File**: `src/components/submissions/submission-form.tsx`
**Agent**: Implement directly (most complex step, careful refactor)

### 6. Update seed data

- Update `src/actions/admin/seed-data.ts` if the schema index change requires it
  (likely no seed change needed for an index-only addition)

### 7. Verification

- `bun run build` to verify no type errors
- `bun run lint` to verify no lint issues
- Manual test plan in spec verification section

## Subagents

- **Step 1-3**: Can be implemented by a single backend-focused agent
- **Step 4-5**: Can be implemented by a single frontend-focused agent
- Steps 1-3 and 4-5 are somewhat sequential (frontend depends on backend types),
  but the dialog component (step 4) can be built in parallel with backend work

## Critical files

- `src/actions/submissions/create-submission.ts` -- main action to modify
- `src/components/submissions/submission-form.tsx` -- form to modify
- `src/lib/schemas/submission.ts` -- schema to extend
- `src/lib/db/schema.ts` -- index to add
- `src/components/common/alert-dialog.tsx` -- existing component to reuse
