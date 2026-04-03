# Video Field Updates

## Context

Three related changes: (1) add VIDEO as a custom field type, (2) change the system video field from multiple URLs to a single URL (including DB migration), (3) fix toggle label positioning in custom fields.

Full spec: `docs/superpowers/specs/2026-04-02-video-field-updates-design.md`

## Step 1: Toggle label fix (quick win)

**Files:** `src/components/submissions/custom-field-display.tsx`

Swap the child order in the TOGGLE case so `<Switch>` renders first (left), then label+description (right).

**Agent:** Direct edit, no subagent needed.

## Step 2: Add VIDEO custom field type

**Files:**
- `src/lib/types.ts` — add `"VIDEO"` to `CustomFormFieldType`
- `src/lib/schemas/form-fields.ts` — add `"VIDEO"` to `customFormFieldTypeSchema` enum
- `src/components/productions/form-fields-editor.tsx` — add `VIDEO: "Video link"` to `FIELD_TYPE_LABELS`
- `src/components/submissions/custom-field-display.tsx` — add VIDEO case: `<Input type="url">` + `<VideoEmbed>` preview, auto-prepend `https://` on blur
- `src/components/productions/submission-info-panel.tsx` — add VIDEO case in custom field display: render `VideoEmbed` from `answer.textValue`

**Agent:** Direct edits. Reuse existing `VideoEmbed` component from `@/components/submissions/video-embed`.

## Step 3: System video field — single URL

### 3a: Database & schema

**Files:**
- `src/lib/db/schema.ts` — change `videoUrls: text().array().notNull().default([])` to `videoUrl: text()` (nullable)
- `src/lib/schemas/submission.ts` — change `videoUrls` array schema to `videoUrl: httpUrl.optional()` in both `submissionFormSchema` and `updateSubmissionFormSchema`
- `src/lib/submission-helpers.ts` — change `videoUrls: string[]` to `videoUrl: string | null`
- Generate migration with `bun drizzle-kit generate`

### 3b: Server actions

**Files:**
- `src/actions/submissions/create-submission.ts` — destructure `videoUrl` instead of `videoUrls`, update required validation
- `src/actions/submissions/update-submission.ts` — use `videoUrl`
- `src/actions/submissions/copy-submission-to-role.ts` — copy `videoUrl`
- `src/actions/candidates/get-candidate.ts` — return `videoUrl`
- `src/actions/productions/get-production-submissions.ts` — return `videoUrl`

### 3c: Components

**Files:**
- `src/components/submissions/submission-form.tsx` — replace `VideoUrlEditor` with single `<Input type="url">` + `<VideoEmbed>`, update form default from `videoUrls: []` to `videoUrl: ""`, update required validation message
- `src/components/productions/submission-edit-form.tsx` — same change
- `src/components/productions/submission-info-panel.tsx` — render single `VideoEmbed` from `submission.videoUrl`
- `src/components/productions/submission-form-preview.tsx` — no change needed (already shows single input)

### 3d: Cleanup

- Delete `src/components/submissions/video-url-editor.tsx` (no longer imported anywhere)

## Step 4: Lint check

Run `bun run lint` to verify no issues.

**Agent:** Direct Bash call.

## Verification

1. `bun run lint` passes
2. `bun run build` compiles without errors
3. Manual checks for the user:
   - Visit production form settings: VIDEO should appear in the custom field type dropdown as "Video link"
   - Add a VIDEO custom field, verify it renders a URL input with embed preview
   - System video field should show a single URL input (not add/remove multiple)
   - TOGGLE custom fields should show the switch on the left, label on the right
