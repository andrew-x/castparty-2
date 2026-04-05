# Remove Denormalized Candidate Info from Submissions

## Context

`firstName`, `lastName`, `email`, `phone`, and `location` are currently stored on **both** `Candidate` and `Submission` tables, with sync logic keeping them in lockstep. This denormalization adds complexity (every update syncs to all sibling submissions) and serves no purpose since submissions always have a `candidateId` FK. We're removing these 5 fields from `Submission` and reading/writing them exclusively through the `Candidate` record.

The submission edit form UX stays the same — candidate info fields still appear inline, but writes go to the candidate record.

## Key Decision

**No convenience accessors.** `SubmissionWithCandidate` will not keep top-level aliases for the 5 fields. All consumers must use `submission.candidate.firstName`, etc. This creates compile-time breaks that force every consumer to be updated, eliminating any risk of stale dual-path reads.

---

## Step 1: Schema & Types

**Agent:** Subagent (code changes)

### 1a. Drop columns from Submission table
**File:** `src/lib/db/schema.ts` (lines 429-433)

Remove these 5 lines from the `Submission` table definition:
```
firstName, lastName, email, phone, location
```

### 1b. Update `SubmissionWithCandidate` interface
**File:** `src/lib/submission-helpers.ts` (lines 66-103)

- Remove top-level `firstName`, `lastName`, `email`, `phone`, `location` (lines 70-74)
- Add `location` to the `candidate` sub-object (currently missing — only has id, firstName, lastName, email, phone)

After:
```ts
candidate: {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
}
```

### 1c. Update submission form schemas
**File:** `src/lib/schemas/submission.ts`

No changes needed. The form schemas still collect `firstName`/`lastName`/`email`/`phone`/`location` from the user — they just get routed to the candidate record by the action.

---

## Step 2: Server Actions (Writes)

**Agent:** Subagent (code changes)

### 2a. `create-submission.ts`
**File:** `src/actions/submissions/create-submission.ts`

- **Duplicate check (lines 65-66):** Currently queries `Submission.email`. Rewrite to: find candidate by `(orgId, email)`, then check for existing submissions by `candidateId + roleIds`.
- **Submission insert (lines 361-379):** Remove `firstName`, `lastName`, `email`, `phone`, `location` from the `.values()` call. Keep `candidateId` (already present).

### 2b. `update-submission.ts`
**File:** `src/actions/submissions/update-submission.ts`

- **Submission query (line 42):** Change `columns: { id: true, candidateId: true, email: true }` — read `email` from the candidate relation instead (`with: { candidate: { columns: { email: true } } }`)
- **Email conflict check (line 62):** Change `submission.email` to `submission.candidate.email`
- **Submission update (lines 215-229):** Remove the 5 fields from `.set()`. Keep `links`, `videoUrl`, `unionStatus`, `representation`, `updatedAt`.
- **Candidate update (lines 232-242):** Keep as-is (this is the canonical write).
- **Sync to other submissions (lines 244-260):** **Delete entirely.** This block syncs denormalized fields to sibling submissions — no longer needed.

### 2c. `copy-submission-to-role.ts`
**File:** `src/actions/submissions/copy-submission-to-role.ts`

- **Submission insert (lines 104-122):** Remove `firstName`, `lastName`, `email`, `phone`, `location` from `.values()`. Keep `candidateId` (already present via `source.candidateId`).

---

## Step 3: Server Actions (Reads)

**Agent:** Subagent (code changes)

### 3a. `get-production-submissions.ts`
**File:** `src/actions/productions/get-production-submissions.ts`

- **Mapping (lines 163-191):** Remove `firstName: sub.firstName`, `lastName: sub.lastName`, `email: sub.email`, `phone: sub.phone`, `location: sub.location` from the object literal. The candidate data already comes through `candidate: sub.candidate` (line 190).

### 3b. `send-submission-email.tsx`
**File:** `src/actions/submissions/send-submission-email.tsx`

- **Query (lines 36-50):** Remove `firstName`, `lastName`, `email` from `columns`. Add `candidate` to `with`:
  ```ts
  with: {
    candidate: { columns: { firstName: true, lastName: true, email: true } },
    role: ...,
    production: ...,
  }
  ```
- **Template variables (lines 71-73):** Change to `submission.candidate.firstName`, `submission.candidate.lastName`
- **Send email (line 88):** Change `to: submission.email` to `to: submission.candidate.email`
- **Email record (line 102):** Change `toEmail: submission.email` to `toEmail: submission.candidate.email`

---

## Step 4: UI Components

**Agent:** Subagent (code changes) — can run in parallel with Step 3

All references to `submission.firstName` etc. become `submission.candidate.firstName` etc.

### 4a. `kanban-card.tsx`
**File:** `src/components/productions/kanban-card.tsx`

- Line 68: aria-label
- Lines 369-370: Avatar initials
- Line 376: Display name

### 4b. `submission-table-view.tsx`
**File:** `src/components/productions/submission-table-view.tsx`

- Line 115: Column accessor
- Line 345: aria-label
- Line 362: img alt
- Lines 369-376: Avatar and display name

### 4c. `submission-edit-form.tsx`
**File:** `src/components/productions/submission-edit-form.tsx`

- Lines 59-67: Default values — read from `submission.candidate.*`

### 4d. `submission-info-panel.tsx`
**File:** `src/components/productions/submission-info-panel.tsx`

- Any references to `submission.firstName` etc. → `submission.candidate.*`

### 4e. `submission-detail-sheet.tsx`
**File:** `src/components/productions/submission-detail-sheet.tsx`

- Review for any direct field access (likely just passes submission object through)

---

## Step 5: Seed Data

**Agent:** Subagent (code changes)

**File:** `src/actions/admin/seed-data.ts`

Remove `firstName`, `lastName`, `email`, `phone`, `location` from the `Submission` insert values. These are already set on the Candidate records.

---

## Step 6: Migration

**Run:** `bunx drizzle-kit generate` to generate a migration that drops the 5 columns from `submission`.

Then `bunx drizzle-kit push` (or `migrate` depending on workflow) to apply.

**Note:** This is a destructive migration (dropping columns). The code changes must be deployed before the migration runs to avoid runtime errors reading columns that no longer exist.

---

## Verification

1. `bun run build` — TypeScript compilation succeeds with no errors (the type change to `SubmissionWithCandidate` will catch any missed references)
2. `bun run lint` — Biome passes
3. Manual testing:
   - Submit a new audition via the public form → candidate record created with correct info, submission has no name/email fields
   - Edit a submission's name/email in the detail sheet → candidate record updated, change visible on all submissions for that candidate
   - Copy submission to another role → new submission created without denormalized fields
   - Kanban and table views display correct names
   - Send an email from a submission → correct recipient name/email
