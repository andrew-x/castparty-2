# Plan: Three UI Tweaks

## Context
Three small UI improvements: fix submit button copy, remove nav top padding, and add form previews to the production creation flow.

## Changes

### 1. Change "Submit audition" to "Submit"

**Files:**
- `src/components/submissions/submission-form.tsx` (line 491) — change `"Submit audition"` to `"Submit"`
- `src/components/productions/submission-form-preview.tsx` (line 129) — change `Submit audition` to `Submit`

### 2. Remove top padding on production sub-nav

**File:** `src/components/common/sub-nav.tsx` (line 60)

Remove `pt-group` from the nav className. This affects all sub-navs (production, org settings, etc.), not just production view. Changing from:
```
"flex flex-1 flex-col gap-tight pt-group"
```
to:
```
"flex flex-1 flex-col gap-tight"
```

### 3. Add form previews to production creation flow

**File:** `src/components/productions/create-production-form.tsx`

Add `SubmissionFormPreview` and `FeedbackFormPreview` alongside the form field editors in steps 3 and 4. Follow the same two-column responsive layout pattern used in `form-builder.tsx`:
- Left column: existing `FormFieldsEditor`
- Right column: sticky preview (hidden on mobile, visible on `lg:`)

Use `DEFAULT_SYSTEM_FIELD_CONFIG` from `@/lib/types` for the submission form preview (since system fields aren't configured during creation — they use defaults).

**New imports:**
- `SubmissionFormPreview` from `@/components/productions/submission-form-preview`
- `FeedbackFormPreview` from `@/components/productions/feedback-form-preview`
- `DEFAULT_SYSTEM_FIELD_CONFIG` from `@/lib/types`

**Step 3 (submissionForm):** Wrap the existing content area in a `grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-section` layout, with `SubmissionFormPreview` in the right column (sticky, hidden on mobile).

**Step 4 (feedbackForm):** Same pattern with `FeedbackFormPreview`.

## Verification

- Visit `/productions/new`, step through to the Submission Form and Feedback Form steps — previews should appear on the right on desktop
- Visit any production's sub-nav — no top padding gap
- Visit a submission form as a performer — button should read "Submit"
