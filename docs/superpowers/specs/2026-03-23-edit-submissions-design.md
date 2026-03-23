# Edit Submissions

## Problem

Casting directors cannot correct or update submission data after it's been submitted.
If a performer's name is misspelled, phone number is wrong, or they forgot to attach
a headshot, the only option is to delete and re-submit — which doesn't exist either.

## Solution

Two editing surfaces, matching where the data is displayed:

1. **Edit Contact Dialog** — modal for name, email, phone, location, and links
2. **Inline file adding** — add headshots and resume directly in the info panel

## Scope

### Editable (dialog)
- firstName, lastName, email, phone, location, links

### Addable (inline)
- Headshots — append new headshots to existing ones
- Resume — add a resume if none exists

### Not editable
- Custom form responses (answers) — read-only, never editable after submission
- Existing files — cannot remove or replace existing headshots/resume

## Design

### Edit Contact Dialog

- Triggered by a pencil/edit icon button in the detail sheet header
- Modal dialog following `ConsiderForRoleDialog` pattern
- Pre-populated with current submission values
- Uses `useHookFormAction` with a new `updateSubmissionContactSchema`
- On save: updates Submission row + syncs Candidate record (same email-based upsert as create)

### Inline File Adding

- Headshots section: "Add headshots" button below existing thumbnail grid
- Resume section: "Add resume" button shown only when no resume exists
- Uses existing `HeadshotUploader` and `ResumeUploader` components
- Same presign → upload → move flow as submission creation
- New `addSubmissionFiles` server action handles file additions

### Server Actions

**`updateSubmission`** (`src/actions/submissions/update-submission.ts`)
- `secureActionClient` (authenticated casting directors only)
- Validates ownership chain: submission → production → org
- Updates this Submission row (contact fields + links)
- Updates Candidate record to stay in sync
- **Cascades contact changes to all sibling submissions** for the same candidate (keeps all submissions consistent)
- Revalidates path

### Candidate Cascade Notice

The edit dialog shows an info alert when any contact field is dirty: "Changes to contact info will update this candidate's profile and all their other submissions." This prevents surprise side effects when a casting director edits one submission and it affects others.

**`addSubmissionFiles`** (`src/actions/submissions/add-submission-files.ts`)
- `secureActionClient`
- Validates ownership chain
- Moves headshot files from temp → permanent, creates File records
- If resume: moves from temp → permanent, creates File record, parses PDF text
- Guards: won't add resume if one already exists

### Schemas

**`updateSubmissionContactSchema`** (in `src/lib/schemas/submission.ts`):
```
submissionId: string
firstName: string (trimmed, 1-100)
lastName: string (trimmed, 1-100)
email: string (trimmed, valid email)
phone: string (trimmed, optional)
location: string (trimmed, max 200, optional)
links: URL array
```

**`addSubmissionFilesSchema`** (in `src/lib/schemas/submission.ts`):
```
submissionId: string
headshots: HeadshotFileSchema[] (max 10, optional)
resume: ResumeFileSchema (optional)
```

### UI Components

**New:** `EditSubmissionDialog` (`src/components/productions/edit-submission-dialog.tsx`)
**Modified:** `SubmissionDetailSheet` — add Edit button, wire dialog state
**Modified:** `SubmissionInfoPanel` — add inline file upload UI with add buttons

## Access Control

All edit operations use `secureActionClient` — only authenticated org members can edit.
The public submission form is unaffected.
