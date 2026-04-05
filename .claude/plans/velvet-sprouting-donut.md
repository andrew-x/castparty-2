# Plan: Duplicate Submission Check & Confirmation Redesign

## Context

Candidates can submit multiple times for the same role with the same email because
there's no duplicate check. This creates noise for casting directors. We add a
server-side check that filters out already-submitted roles, and redesign the
confirmation screen to communicate any skipped roles.

Two files change. No schema migrations. No new files.

## Steps

### Step 1: Server action -- add `name` to roles query

**File:** `src/actions/submissions/create-submission.ts` (line 45-49)

Add `name: true` to the roles query `columns` so we can include human-readable names
in the skipped roles response.

### Step 2: Server action -- duplicate check + early return

**File:** `src/actions/submissions/create-submission.ts` (insert after line 60)

After role validation, before production validation:

1. Query existing submissions: `db.query.Submission.findMany` where email matches and
   roleId is in the requested set. All imports already exist.
2. Build `alreadySubmittedRoleIds` set, compute `newRoleIds` and `skippedRoles` (names).
3. If `newRoleIds` is empty, return `{ ids: [], skippedRoles }` immediately (skip all
   file uploads, candidate upsert, DB writes).

### Step 3: Server action -- use `newRoleIds` downstream

**File:** `src/actions/submissions/create-submission.ts`

Replace `roleIds` with `newRoleIds` in two places:
- Submission ID generation (`roleIds.map(() => generateId("sub"))`)
- Submission insert (`.values(roleIds.map(...))`)

Candidate upsert stays unchanged (always runs). Everything else uses `submissionIds`
which is already derived from the filtered list.

### Step 4: Server action -- update return value

**File:** `src/actions/submissions/create-submission.ts` (line 426)

Change `return { ids: submissionIds }` to `return { ids: submissionIds, skippedRoles }`.

### Step 5: Client form -- state + onSuccess

**File:** `src/components/submissions/submission-form.tsx`

- Add `submittedIds` and `skippedRoles` state variables
- Update `onSuccess({ data })` to populate both from action result
- Add `CircleCheck` to the lucide-react import

### Step 6: Client form -- redesign confirmation screen

**File:** `src/components/submissions/submission-form.tsx` (lines 153-178)

Replace the Alert + "Browse other roles" button with:
- CircleCheck icon (size-10, text-brand), centered
- Dynamic title based on `submittedIds.length`
- Body text in muted-foreground
- Conditional skip notice when `skippedRoles.length > 0`
- Edge case: all skipped shows "Already submitted" with role list

### Step 7: Lint check

Run `bun run lint` to verify no issues.

## Agents

- **Main agent**: All implementation (only 2 files, tightly coupled)
- **Code-reviewer agent**: Review after implementation
- **Librarian agent**: Update docs after implementation

## Verification

1. Fresh submission for 2 roles: both succeed, no skip notice
2. Same email + same 2 roles again: "Already submitted" with both names
3. Same email + 3 roles (2 old + 1 new): 1 submission, skip notice for the 2
4. DB check: no duplicate (email, roleId) rows after tests

## Critical Files

- `src/actions/submissions/create-submission.ts`
- `src/components/submissions/submission-form.tsx`
