# Submission Editing

> **Last verified:** 2026-04-02

## Overview

Casting directors can edit a submission's contact details, links, headshots, and resume directly within the submission detail sheet without navigating away. This addresses the common scenario where performers provide outdated contact information at audition sign-in. Custom form responses remain read-only to preserve audit integrity of what the performer originally submitted.

**Who benefits:** Casting directors (quick corrections without recreating submissions).

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| N/A (in-sheet) | `SubmissionEditForm` | Org member via `secureActionClient` | Edit mode rendered inside `SubmissionDetailSheet` |

Not a separate route -- it is an `isEditing` toggle state within `SubmissionDetailSheet`, accessed via the ellipsis actions menu.

## Data Model

| Table | Role in editing |
|-------|-----------------|
| `Submission` | Updated: firstName, lastName, email, phone, location, links, videoUrl, updatedAt |
| `Candidate` | Updated in same transaction: firstName, lastName, email, phone, location, updatedAt |
| `File` | New headshot/resume rows inserted (type: `HEADSHOT` or `RESUME`) |

Contact field changes propagate to all other submissions for the same candidate (denormalized sync within the transaction).

## Key Files

| File | Purpose |
|------|---------|
| `src/components/productions/submission-edit-form.tsx` | Client form; pre-populates from `SubmissionWithCandidate`; handles upload + save |
| `src/components/productions/submission-detail-sheet.tsx` | Owns `isEditing` boolean; swaps between info panel and edit form |
| `src/components/productions/submission-actions-menu.tsx` | Ellipsis menu: "Edit submission" and "Consider for another role" |
| `src/components/productions/submission-info-panel.tsx` | Read-only view; shows all fields including unanswered ("Not answered" in italics) |
| `src/actions/submissions/update-submission.ts` | `secureActionClient`; validates, moves files, runs Submission+Candidate update in transaction |
| `src/lib/schemas/submission.ts` | `updateSubmissionFormSchema` + `updateSubmissionActionSchema` |
| `src/components/submissions/headshot-uploader.tsx` | Reused with `maxFiles` prop for remaining slots |
| `src/components/submissions/resume-uploader.tsx` | Only shown when no resume exists |

## How It Works

```
SubmissionDetailSheet
  ├── Header: SubmissionActionsMenu (ellipsis popover)
  │     ├── "Edit submission"           → setIsEditing(true)
  │     └── "Consider for another role" → opens consider-for-role dialog
  │
  ├── [isEditing = false] → SubmissionInfoPanel (read-only)
  │
  └── [isEditing = true]  → SubmissionEditForm
        ├── Contact fields: firstName, lastName, email, phone, location
        ├── LinksEditor (controlled via react-hook-form)
        ├── HeadshotUploader — add-only, maxFiles = (10 - existing count)
        ├── ResumeUploader  — only shown when no resume exists
        ├── Form responses  — read-only display
        └── Save button
```

### Save Flow

```
form.handleSubmit:
  1. Upload new headshots (if any): presign → PUT to R2 temp/
  2. Upload new resume (if present): presign → PUT to R2 temp/
  3. action.execute({ ...formValues, submissionId, newHeadshots, newResume })

updateSubmission action:
  1. Auth + org ownership check
  2. Email conflict check (same email, different candidate in org → throw)
  3. Headshot capacity check (existing + new ≤ 10)
  4. Resume check (block if resume already exists)
  5. Move files from temp/ to permanent R2 storage
  6. db.transaction:
     ├── Insert new File rows
     ├── UPDATE Submission (contact, links)
     ├── UPDATE Candidate (contact fields)
     └── UPDATE all other Submissions for same candidate (denormalized sync)
  7. If new resume: extract text via unpdf (best-effort)
  8. revalidatePath
```

## Business Logic

### Validation Rules

| Rule | Implementation |
|------|---------------|
| First/last name required | `z.string().trim().min(1).max(100)` |
| Valid email required | `z.string().trim().email()` |
| Phone optional | `z.string().trim().max(50).optional().or(z.literal(""))` |
| Location optional | `z.string().trim().max(200).optional().or(z.literal(""))` |
| Links must be valid URLs | `z.array(z.string().trim().url())` |
| Video URL optional | `httpUrl.or(z.literal("")).optional()` |
| Max 10 headshots total | Server checks existing + new ≤ 10 |
| Max 20 MB per headshot | Enforced by `headShotFileSchema.size` |
| Max 10 MB per resume | Enforced by `resumeFileSchema.size` |

### Edit Constraints

- **Headshots cannot be removed** -- add-only covers the common case; deletion needs separate confirmation.
- **Resume upload only when none exists** -- prevents silent overwrite of original submission.
- **Custom form responses are read-only** -- preserves audit integrity.

### Email Conflict Check

If email is changed, queries for another `Candidate` with the same email in the same org. Runs inside transaction to prevent TOCTOU races.

### Denormalized Candidate Sync

Contact changes propagate to all other submissions for the same candidate, keeping Kanban cards consistent across roles.

## UI States

| State | Behavior |
|-------|----------|
| **View mode** | `SubmissionInfoPanel` with headshots, resume, links, form responses |
| **Edit mode** | `SubmissionEditForm` pre-populated with current values |
| **Uploading** | Button shows "Uploading files..." with spinner |
| **Saving** | Button shows spinner; cancel disabled |
| **Upload error** | Error near uploader |
| **Server error** | Root form error alert (e.g., "This email belongs to a different candidate") |
| **Navigation** | `isEditing` auto-resets to false when submission changes |
| **Success** | `onSaved()` fires; parent sets `isEditing(false)` + `router.refresh()` |

## Integration Points

- [Kanban](./kanban.md) -- `SubmissionDetailSheet` is the parent that owns `isEditing` state
- [Submissions](./submissions.md) -- reuses `HeadshotUploader`, `ResumeUploader`, and R2 two-phase upload pattern
- [Candidates](./candidates.md) -- `Candidate` record synced in same transaction

## Architecture Decisions

- **Submission and Candidate in same transaction.** Prevents partial updates to the cross-production identity record.
- **Email conflict check inside transaction.** Atomic check-and-update prevents race conditions.
- **`maxFiles` prop on HeadshotUploader.** Edit form passes `10 - existingCount` for consistent client/server validation.
- **Pre-validation before side effects.** All checks run before files are moved, preventing orphaned files on validation failure.
- **Denormalized sync.** Contact fields duplicated on each Submission for simple reads; wider UPDATE on save is the trade-off.
