# Feedback Form Preview

## Context

The submission form builder already has a split layout: custom field editor on the left, live preview on the right. The feedback form settings pages have no preview — just the `FormFieldsEditor` alone. The user wants the same preview experience for the feedback form, but simpler: rating and notes are always-visible system fields (not configurable), and only custom fields are editable.

## Plan

### Step 1: Create `FeedbackFormPreview` component

**New file:** `src/components/productions/feedback-form-preview.tsx`

A read-only preview mirroring the structure of `SubmissionFormPreview` but for the feedback form. Always renders:
- **Rating** — radio group with the 4 options (Strong yes / Yes / No / Strong no), all disabled
- **Notes** — disabled textarea

Then renders custom fields via `CustomFieldDisplay` (same shared component used by submission preview).

Ends with a disabled "Submit feedback" button.

Props: `{ customFields: CustomForm[] }`

No `SystemFieldConfig` needed since rating/notes are always shown and not configurable.

Reference files:
- `src/components/productions/submission-form-preview.tsx` — pattern to follow
- `src/components/submissions/custom-field-display.tsx` — reuse for custom fields
- `src/components/productions/feedback-panel.tsx` — rating options/labels to match (`RATING_LABELS`, `RATING_OPTIONS`)

### Step 2: Create `FeedbackFormBuilder` layout component

**New file:** `src/components/productions/feedback-form-builder.tsx`

A split layout component similar to `FormBuilder` but without `SystemFieldToggles`. Layout:
- Left: `FormFieldsEditor` (custom fields only)
- Right: sticky `FeedbackFormPreview` (hidden on mobile)

Grid: `lg:grid-cols-[1fr_440px]` (same as submission form builder).

Props: same as `FormFieldsEditor` props (fields, onAdd, onSave, onRemove, onReorder, isAdding, isSaving, removingFieldId, description).

Reference: `src/components/productions/form-builder.tsx`

### Step 3: Update `DefaultFeedbackFormFieldsEditor`

**Modify:** `src/components/productions/default-feedback-form-fields-editor.tsx`

Change `return` from `<FormFieldsEditor ... />` to `<FeedbackFormBuilder ... />`. Import `FeedbackFormBuilder`. No other logic changes needed — all the action wiring stays the same.

### Step 4: Update `RoleFeedbackFormFieldsEditor`

**Modify:** `src/components/productions/role-feedback-form-fields-editor.tsx`

Same change: replace `<FormFieldsEditor ... />` with `<FeedbackFormBuilder ... />`.

### Step 5: Update feedback form settings pages

**Modify both pages:**
- `src/app/(app)/productions/[id]/(production)/settings/feedback-form/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/settings/feedback-form/page.tsx`

Changes:
- Remove `max-w-page-content` class (wider layout for split view)
- Remove the `<h2>Feedback form</h2>` heading (the editor + preview fills the space)

### Step 6: Lint and build

Run `bun run lint` and `bun run build` to verify.

## Verification

1. Visit a production's feedback form settings page — should see split layout with editor left, preview right
2. Visit a role's feedback form settings page — same split layout
3. Preview should always show Rating (4 radio options) and Notes fields
4. Adding/removing/reordering custom fields should update the preview in real time
5. Preview should be hidden on mobile (< lg breakpoint)
6. Lint and build pass clean
