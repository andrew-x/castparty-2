# Duplicate Submission Check & Confirmation Redesign

## Context

Candidates can currently submit multiple times for the same role with the same email.
There is no unique constraint or server-side check preventing this. This creates
duplicate work for casting directors reviewing submissions. We need to detect and
prevent duplicate submissions while still allowing a candidate to submit for roles
they haven't applied to yet in a multi-role submission.

Additionally, the confirmation screen after submission is bare (just an Alert box and
a "Browse other roles" button). It needs a visual upgrade and should communicate any
skipped duplicate roles.

## Changes

### 1. Server Action: `src/actions/submissions/create-submission.ts`

**New duplicate check** inserted after role/production validation (around line 60),
before file uploads begin:

```
Query: SELECT roleId FROM Submission WHERE email = :email AND roleId IN (:roleIds)
```

- Build `alreadySubmittedRoleIds` set from query results
- Compute `newRoleIds = roleIds.filter(id => !alreadySubmittedRoleIds.has(id))`
- Look up role names for skipped IDs (from the already-fetched `roles` array)

**Branching logic:**

- If `newRoleIds.length === 0`: skip file uploads, candidate upsert, and submission
  creation entirely. Return `{ ids: [], skippedRoles: ["Role A", "Role B"] }`.
- If `newRoleIds.length > 0`: proceed with existing flow but use `newRoleIds` instead
  of `roleIds` for submission creation, file inserts, and email sends. Candidate
  record still gets upserted. Return `{ ids: [...], skippedRoles: [...] }`.

**Return type change:** `{ ids: string[] }` becomes `{ ids: string[], skippedRoles: string[] }`.

### 2. Client Form: `src/components/submissions/submission-form.tsx`

**New state:**
- `skippedRoles: string[]` (default `[]`)

**onSuccess handler update:**
- Read `data.skippedRoles` from the action result and store in state
- Set `submitted = true` as before

**Confirmation screen redesign** (replaces lines 153-178):

```
+---------------------------------------+
|                                       |
|            (CircleCheckIcon)          |
|                                       |
|       N submissions received          |
|                                       |
|  The production team will review      |
|  your submissions and be in touch     |
|  if they want to move forward.        |
|                                       |
|  (if skipped roles:)                  |
|  You already submitted for Role A     |
|  and Role B, so those were skipped.   |
|                                       |
+---------------------------------------+
```

- CircleCheckIcon from lucide-react, centered, in brand color
- Title: dynamic singular/plural based on `ids.length` (successful submissions only)
- Body: one sentence, muted foreground
- Skipped notice: only rendered when `skippedRoles.length > 0`, muted text
- "Browse other roles" button removed
- Same card container (`rounded-lg border bg-background p-6 shadow-sm`)
- Content centered with `text-center` and `items-center`

**Edge case: all roles skipped.** When `ids.length === 0` and `skippedRoles.length > 0`:
- Title: "Already submitted"
- Body: "You already submitted for [role list]. No new submissions were created."

### 3. Files Modified

| File | Change |
|------|--------|
| `src/actions/submissions/create-submission.ts` | Add duplicate check query, filter roleIds, change return type |
| `src/components/submissions/submission-form.tsx` | Add skippedRoles state, update onSuccess, redesign confirmation |

No schema changes. No new files. No migrations.

## Verification

1. **Fresh submission:** Submit for 2 roles with a new email. Both should succeed.
   Confirmation shows "2 submissions received" with no skip notice.
2. **Full duplicate:** Submit again with same email and same 2 roles. Confirmation
   shows "Already submitted" with both role names listed.
3. **Partial duplicate:** Submit for 3 roles (2 already submitted + 1 new). Only the
   new role creates a submission. Confirmation shows "Submission received" with a
   note that the other 2 were skipped.
4. **Database check:** Verify no duplicate (email, roleId) rows exist after tests.
