# Submission Deduplication

## Context

The public submission form has no duplicate prevention. A candidate can submit to the
same role multiple times, creating duplicate Submission rows. The only existing guard
is in `copySubmissionToRole` (admin-side), which checks `(candidateId, roleId)` before
copying. This spec adds a user-facing dedupe flow to the public submission form.

## Requirements

- When a user submits and their email already has submissions for any selected roles,
  show a warning dialog before proceeding.
- The dialog lists which roles have existing submissions and explains that confirming
  will update them with the new information.
- Confirming is all-or-nothing: update all duplicates and create new submissions in
  one action.
- Existing submissions keep their current pipeline stage (no reset to APPLIED).
- All existing feedback, comments, and pipeline history on updated submissions are
  preserved (we UPDATE rows, never delete and recreate).

## Flow

1. User fills form, selects roles, clicks Submit.
2. Client validation runs (unchanged).
3. Call `checkSubmissionDuplicates({ email, orgId, roleIds })` -- a fast server read.
4. **No duplicates**: proceed with file upload + `createSubmission` (current flow).
5. **Duplicates found**: show AlertDialog. No files uploaded yet.
6. **Cancel**: nothing happens, no side effects.
7. **Confirm**: proceed with file upload, call `createSubmission` with
   `confirmUpdate: true`.
8. The action re-checks duplicates inside its transaction (TOCTOU safety), then
   UPDATEs existing submissions and INSERTs new ones.

## Backend

### New: `src/actions/submissions/check-submission-duplicates.ts`

Plain `"use server"` async function (read-only, no auth -- public form context).

**Input**: `{ email: string, orgId: string, roleIds: string[] }`

**Logic**:
1. Find Candidate by `(orgId, email)` via `db.query.Candidate.findFirst`.
2. If no candidate, return `{ duplicates: [] }`.
3. Query Submissions where `candidateId = candidate.id AND roleId IN (roleIds)`,
   joining with Role for the name.
4. Return `{ duplicates: Array<{ roleId: string, roleName: string, submissionId: string }> }`.

### Modified: `src/lib/schemas/submission.ts`

Add to `submissionActionSchema`:
```ts
confirmUpdate: z.boolean().default(false),
```

### Modified: `src/actions/submissions/create-submission.ts`

After the candidate upsert (inside the transaction):

1. Query existing submissions: `candidateId + roleId IN (roleIds)`.
2. Partition `roleIds` into `existingSubmissions` (with their IDs and stageIds) and
   `newRoleIds`.
3. If `existingSubmissions.length > 0 && !confirmUpdate` -- throw an error (the
   client should have shown the dialog first; this is a safety net).
4. If `confirmUpdate`:
   - **UPDATE** existing submissions with new personal data, answers, links, videoUrl,
     unionStatus, representation, updatedAt. **Do not touch stageId or rejectionReason.**
   - **DELETE** old File rows for updated submissions, INSERT new File rows pointing
     to the newly uploaded files.
   - **INSERT** new Submission rows for `newRoleIds` with `stageId = appliedStage.id`.
5. Return `{ created: number, updated: number }` alongside submission IDs.

**Email handling**: Send "submission received" emails only for newly created
submissions, not for updates.

### Optional: `src/lib/db/schema.ts`

Add composite index on `Submission(candidateId, roleId)` for fast duplicate lookups.

## Frontend

### Modified: `src/components/submissions/submission-form.tsx`

**New state**:
- `pendingFormValues` -- stores validated form values when dupes are found.
- `duplicateRoles` -- `Array<{ roleId, roleName }>` for the dialog.
- `duplicateWarningOpen` -- controls dialog visibility.

**Submit handler changes**:

After client validation and before file upload, call `checkSubmissionDuplicates`.
If duplicates found, store values in state, open dialog, return early.

Extract the file-upload-and-execute logic into a helper (`proceedWithSubmission`)
that both the normal path and the dialog-confirm handler invoke. The helper accepts
an optional `confirmUpdate` flag.

**Success state changes**:

Store `{ created, updated }` from the action result. Adapt the success message:
- All new: "{N} submissions received"
- All updated: "{N} submissions updated"
- Mixed: "{created} new, {updated} updated"

### New: `src/components/submissions/duplicate-warning-dialog.tsx`

Uses `AlertDialog` from `@/components/common/alert-dialog`.

**Props**:
```ts
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  duplicateRoles: Array<{ roleId: string; roleName: string }>
  newRoleCount: number
  onConfirm: () => void
  loading: boolean
}
```

**Copy**:
- Title: "You've already submitted for some of these roles"
- Body: "You have an existing submission for: **{role names}**. Confirming will
  update those submissions with the information you entered. Your position in the
  review process won't change."
- If new roles too: "You'll also be submitted for {N} new role(s)."
- Cancel button: "Cancel"
- Action button: "Update and submit"

## Edge Cases

**TOCTOU race**: The action re-checks inside its transaction, so a concurrent
submission between the check and the action results in a correct update rather than
a duplicate. The user may not have seen the warning dialog, but data integrity is
preserved.

**Orphaned R2 files**: When updating, old File rows are deleted but R2 objects remain.
This matches the existing pattern. R2 lifecycle rules handle cleanup.

**All roles are duplicates**: Dialog still shows. On confirm, all submissions are
updated, zero new created. Success message says "{N} submissions updated."

**Candidate changed email**: If someone submits with a different email than before,
they become a new Candidate with new Submissions. This is correct -- we identify
candidates by email within an org.

## Verification

1. Submit to role A. Submit again to role A with same email -- dialog should appear
   warning about the existing submission. Confirm. Verify the submission was updated
   (new data) but the stage did not change.
2. Submit to role A. Then submit to roles A + B with same email. Dialog should show
   role A as existing. Confirm. Verify A was updated and B was newly created.
3. Submit to roles A + B. Submit again to A + B. Dialog shows both as existing.
   Confirm. Both updated.
4. Submit to role A. Submit to role B (no overlap). No dialog, proceeds normally.
5. Cancel the dialog -- verify no files were uploaded and no data changed.
6. Check that feedback, comments, and stage on existing submissions are preserved
   after an update.
