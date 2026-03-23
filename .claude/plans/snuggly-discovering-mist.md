# Plan: Edit Submissions

## Context

Casting directors need to correct submission data after it's been submitted — fixing misspelled names, wrong phone numbers, adding missing headshots/resumes. Currently submissions are write-once (except for stage changes). This adds two editing surfaces: a dialog for contact info/links, and inline file adding in the detail panel.

## Steps

### 1. Add Zod schemas for edit operations

**File:** `src/lib/schemas/submission.ts`

Add two new schemas:

**`updateSubmissionContactSchema`:**
```ts
submissionId, firstName, lastName, email, phone, location, links
```
Reuse trimming/validation rules from existing `submissionFormSchema`. Extract a shared base or just duplicate the field definitions (they're small).

**`addSubmissionFilesSchema`:**
```ts
submissionId, headshots (HeadshotFileSchema[]), resume (ResumeFileSchema, optional)
```

### 2. Create `updateSubmission` server action

**New file:** `src/actions/submissions/update-submission.ts`

- Use `secureActionClient` with `updateSubmissionContactSchema`
- Validate ownership: submission → role → production → org (query Submission with production relation)
- Update this Submission row: firstName, lastName, email, phone, location, links
- Update Candidate row: firstName, lastName, email, phone, location (using submission.candidateId)
- **Cascade to all sibling submissions:** Query all other Submissions with the same `candidateId` and update their firstName, lastName, email, phone, location to match. This keeps all submissions for a candidate consistent when contact info changes.
- `revalidatePath("/", "layout")`

**Reuse:** Ownership validation pattern from `update-submission-status.ts`. Candidate sync pattern from `create-submission.ts`.

### 3. Create `addSubmissionFiles` server action

**New file:** `src/actions/submissions/add-submission-files.ts`

- Use `secureActionClient` with `addSubmissionFilesSchema`
- Validate ownership chain (same as step 2)
- If headshots provided:
  - Count existing headshots for this submission (query File table)
  - Validate total won't exceed 10
  - Move from temp → permanent using `moveFileByKey` (from `src/lib/r2.ts`)
  - Insert File records with correct order (starting after max existing order)
- If resume provided:
  - Check no existing resume exists for this submission
  - Move from temp → permanent
  - Insert File record
  - Parse PDF text (same `unpdf` pattern as `create-submission.ts`)
  - Update Submission.resumeText
- `revalidatePath("/", "layout")`

**Reuse:** File handling from `create-submission.ts` lines 202-279. R2 helpers from `src/lib/r2.ts`.

### 4. Create `EditSubmissionDialog` component

**New file:** `src/components/productions/edit-submission-dialog.tsx`

- Follow `ConsiderForRoleDialog` pattern exactly
- Props: `submission: SubmissionWithCandidate`, `open: boolean`, `onOpenChange: (open: boolean) => void`
- `useHookFormAction` with `updateSubmission` action and `formResolver`
- Default values from `submission` prop
- Form fields: firstName, lastName, email (text inputs), phone, location (text inputs), links (LinksEditor component)
- **Candidate sync notice:** Show an info alert when any contact field (name, email, phone, location) has been changed from its original value: "Changes to contact info will update this candidate's profile and all their other submissions." This warns casting directors that edits cascade to sibling submissions. Use a subtle `Alert` (not destructive) — it appears dynamically as soon as a contact field is dirty.
- Reset form when dialog opens (populate from latest submission data)
- On success: `router.refresh()`, close dialog
- DialogFooter: Cancel + Save buttons

**Reuse:** `LinksEditor` from `src/components/submissions/links-editor.tsx`. Field/FieldGroup from `src/components/common/field.tsx`.

### 5. Add inline file uploading to `SubmissionInfoPanel`

**File:** `src/components/productions/submission-info-panel.tsx`

Changes:
- Add `onFilesAdded?: () => void` callback prop (for parent to refresh)
- **Headshots section:** Add "Add headshots" button below the thumbnail grid. When clicked, show `HeadshotUploader`. On upload complete, call `addSubmissionFiles` action with new headshot metadata, then call `onFilesAdded`.
- **Resume section:** If `submission.resume` is null, show "Add resume" button. When clicked, show `ResumeUploader`. On upload complete, call `addSubmissionFiles` action, then call `onFilesAdded`.
- Both uploaders use the existing presign actions (`presignHeadshotUpload`, `presignResumeUpload`)

This component is already `"use client"` so it can handle the upload state.

**Reuse:** `HeadshotUploader` from `src/components/submissions/headshot-uploader.tsx`. `ResumeUploader` from `src/components/submissions/resume-uploader.tsx`.

### 6. Wire Edit button into `SubmissionDetailSheet`

**File:** `src/components/productions/submission-detail-sheet.tsx`

Changes:
- Import `EditSubmissionDialog`
- Add `editDialogOpen` state
- Add pencil icon button in the header (next to "Consider for role" button)
- Render `EditSubmissionDialog` with submission data
- On dialog success: `router.refresh()` (already happens via the action's revalidatePath)
- Pass `onFilesAdded` to `SubmissionInfoPanel` → `router.refresh()`

## Files to create
- `src/actions/submissions/update-submission.ts`
- `src/actions/submissions/add-submission-files.ts`
- `src/components/productions/edit-submission-dialog.tsx`

## Files to modify
- `src/lib/schemas/submission.ts` — add 2 new schemas
- `src/components/productions/submission-info-panel.tsx` — inline file uploading
- `src/components/productions/submission-detail-sheet.tsx` — edit button + dialog wiring

## Key files to reference (read, don't modify)
- `src/actions/submissions/create-submission.ts` — file handling + candidate sync patterns
- `src/actions/submissions/update-submission-status.ts` — ownership validation pattern
- `src/components/productions/consider-for-role-dialog.tsx` — dialog + useHookFormAction pattern
- `src/components/submissions/headshot-uploader.tsx` — headshot upload component
- `src/components/submissions/resume-uploader.tsx` — resume upload component
- `src/components/submissions/links-editor.tsx` — links editor component
- `src/lib/r2.ts` — moveFileByKey, checkFileExists, deleteFile
- `src/lib/submission-helpers.ts` — SubmissionWithCandidate type

## Subagents

- Steps 1-3 (schemas + actions): **main agent** — straightforward server code
- Step 4 (EditSubmissionDialog): **main agent** — follows existing dialog pattern closely
- Steps 5-6 (inline files + wiring): **main agent** — modifications to existing components

No parallel agents needed — steps are sequential (schemas → actions → UI → wiring).

## Verification

1. Open a production with existing submissions
2. Click a submission to open the detail sheet
3. **Test edit dialog:** Click the edit (pencil) button → verify fields pre-populated → change name/email/phone/location/links → save → verify changes reflected in sheet header and info panel
4. **Test headshot adding:** In the info panel headshots section, click "Add headshots" → upload 1-2 images → verify they appear in the grid
5. **Test resume adding:** For a submission without a resume, verify "Add resume" button appears → upload a PDF → verify it appears in the resume section
6. **Test resume guard:** For a submission that already has a resume, verify no "Add resume" button appears
7. **Test cascade notice:** In the edit dialog, change a contact field → verify the info alert appears warning about candidate-wide changes. Revert changes → verify alert disappears.
8. **Test candidate sync:** For a candidate with multiple submissions, edit contact info on one → verify the candidate record AND all other submissions for that candidate are updated
8. Run `bun run lint` to verify no Biome errors
9. Run `bun run build` to verify no TypeScript errors
