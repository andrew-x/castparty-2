# Edit Submission in Detail Drawer

## Context

Casting directors need to correct or update submission data after it's been submitted — typos in names/emails, adding missing headshots, uploading a resume that arrived later, etc. Currently the submission detail drawer is entirely read-only for submission data. This feature adds inline editing to the drawer without leaving the page.

Additionally, the form responses section currently hides unanswered questions. This change shows all questions with "Not answered" for empty ones, giving casting directors full visibility into what information is missing.

## Changes Summary

1. **Ellipsis actions menu** replaces the standalone "Consider for role" button in the drawer header
2. **Edit mode** in the left pane for: name, email, phone, location, links, adding headshots, adding resume
3. **Form responses** always shows all questions (view + edit mode), "Not answered" for empty ones
4. **New server action** to persist submission edits + new file uploads

---

## Step 1: Schema — `src/lib/schemas/submission.ts`

Add `updateSubmissionSchema` for the server action:

```ts
export const updateSubmissionSchema = z.object({
  submissionId: z.string().min(1),
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  links: z.preprocess(
    (val) => Array.isArray(val) ? val.filter((v) => typeof v === "string" && v.trim()) : [],
    z.array(z.string().trim().url("Enter a valid URL.")),
  ).default([]),
  newHeadshots: z.array(headShotFileSchema).max(10).default([]),
  newResume: resumeFileSchema.optional(),
})
```

Also add a client-side form schema (without submissionId/file metadata) for react-hook-form:

```ts
export const updateSubmissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  links: /* same preprocess as above */,
})
```

**Subagent:** None — direct edit.

---

## Step 2: Server Action — `src/actions/submissions/update-submission.ts` (new)

Uses `secureActionClient` with `updateSubmissionSchema`. Logic:

1. Verify `activeOrganizationId` from auth context
2. Load submission with `role.production.organizationId` to verify ownership
3. If `newHeadshots` provided: count existing headshots, enforce `existing + new <= 10`, validate temp keys exist, move from temp → permanent, insert File records with `order` continuing from max existing order
4. If `newResume` provided: verify submission has no existing resume, validate temp key, move file, insert File record, parse PDF text (same pattern as `create-submission.ts`)
5. Update Submission table: firstName, lastName, email, phone, location, links
6. Update Candidate table: firstName, lastName, email, phone, location (denormalized fields) — use candidate's `id` from the submission
7. `revalidatePath("/", "layout")`

Reference: `src/actions/submissions/create-submission.ts` for file handling pattern.

**Subagent:** None — direct implementation following established patterns.

---

## Step 3: Form Responses Display — `src/components/productions/submission-info-panel.tsx`

Modify the form responses section (applies to read-only view):

- Always render when `submissionFormFields.length > 0` (remove the `submission.answers.length > 0` guard)
- Iterate over `submissionFormFields` instead of `submission.answers`
- For each field, find matching answer: `submission.answers.find(a => a.fieldId === field.id)`
- Compute display value with existing logic
- If no answer or empty value: show "Not answered" in `text-muted-foreground italic`
- Remove the `if (!displayValue) return null` early exit

**Subagent:** None — small targeted edit.

---

## Step 4: Actions Menu — `src/components/productions/submission-actions-menu.tsx` (new)

Small component using existing `Popover` + `PopoverTrigger` + `PopoverContent`:

- Trigger: `Button` with `variant="outline"`, `size="icon-sm"`, `EllipsisVerticalIcon`
- Two menu items styled as full-width left-aligned buttons with icons:
  - `PencilIcon` + "Edit submission" → calls `onEdit` prop
  - `UserRoundPlusIcon` + "Consider for another role" → calls `onConsiderForRole` prop
- Manages own `open` state; closes popover on item click

Props: `{ onEdit: () => void; onConsiderForRole: () => void }`

**Subagent:** None — small component.

---

## Step 5: Edit Form — `src/components/productions/submission-edit-form.tsx` (new)

The largest piece. Renders in the left pane when edit mode is active.

**Props:**
```ts
interface Props {
  submission: SubmissionWithCandidate
  submissionFormFields: CustomForm[]
  onCancel: () => void
  onSaved: () => void
}
```

**Form fields** (using `react-hook-form` Controller + `updateSubmissionFormSchema`):
- firstName / lastName (2-column grid)
- email
- phone
- location
- Links via existing `LinksEditor` component

**Headshots section:**
- Existing headshots displayed as read-only thumbnail grid (same 3-col layout, no remove buttons, no reordering)
- Below: `HeadshotUploader` for new files only, with `maxFiles` = `10 - existingCount`
- New headshots go through presign → upload → pass metadata to action (same flow as `SubmissionForm`)

**Resume section:**
- If resume exists: show read-only link (same display as view mode)
- If no resume: show `ResumeUploader`
- New resume goes through presign → upload → pass metadata to action

**Form responses section (read-only):**
- Iterate all `submissionFormFields`
- Show question label + answer value or "Not answered" in muted italic
- Not editable — clearly separated visually from editable fields above

**Submit flow:**
1. Presign + upload new headshots (if any)
2. Presign + upload new resume (if any)
3. Call `updateSubmission` action with form values + file metadata
4. On success: call `onSaved()`

**Action buttons:** "Save" (submit) + "Cancel" (ghost, calls `onCancel`)

Reference: `src/components/submissions/submission-form.tsx` for the presign-upload-submit pattern.

**Subagent:** None — direct implementation referencing existing patterns.

---

## Step 6: Wire Up — `src/components/productions/submission-detail-sheet.tsx`

Integrate everything into the drawer:

- Add `isEditing` state, reset to `false` when `submission?.id` changes (prev/next navigation)
- **Header when editing:** Hide contact info line. Keep name visible but static. Hide `StageControls`. Hide actions menu. Show a small "Editing" indicator or just let the form below make it obvious.
- **Header when not editing:** Replace standalone "Consider for role" `Button` with `SubmissionActionsMenu`:
  - `onEdit={() => setIsEditing(true)}`
  - `onConsiderForRole={() => setConsiderDialogOpen(true)}`
- **Left pane:** Conditionally render `SubmissionInfoPanel` (view) or `SubmissionEditForm` (edit):
  - `onCancel={() => setIsEditing(false)}`
  - `onSaved={() => { setIsEditing(false); router.refresh() }}`

**Subagent:** None — direct wiring.

---

## Implementation Order

| Step | File(s) | Depends On |
|------|---------|------------|
| 1 | `src/lib/schemas/submission.ts` | — |
| 2 | `src/actions/submissions/update-submission.ts` | Step 1 |
| 3 | `src/components/productions/submission-info-panel.tsx` | — |
| 4 | `src/components/productions/submission-actions-menu.tsx` | — |
| 5 | `src/components/productions/submission-edit-form.tsx` | Steps 1-2 |
| 6 | `src/components/productions/submission-detail-sheet.tsx` | Steps 3-5 |

Steps 1+3+4 can be parallelized. Step 2 follows Step 1. Steps 5-6 are sequential at the end.

---

## Verification

1. Open a production → role → click a submission to open the drawer
2. Verify ellipsis menu shows "Edit submission" and "Consider for another role"
3. Click "Edit submission" — verify fields populate with current values
4. Edit name, email, phone, location — save — verify changes persist and display correctly
5. Add/remove links — save — verify
6. Add new headshots — save — verify they appear alongside existing ones
7. On a submission without a resume, upload one — save — verify it appears
8. On a submission with a resume, verify no upload option appears (just the read-only link)
9. Verify form responses show all questions with "Not answered" for empty ones (both in view and edit mode)
10. Navigate prev/next while in edit mode — verify it exits edit mode
11. Click Cancel — verify edit mode exits without saving
12. Run `bun run build` to verify no type errors
