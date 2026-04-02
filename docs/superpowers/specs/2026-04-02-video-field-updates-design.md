# Video Field Updates

Three related changes to video handling and toggle layout.

## 1. VIDEO custom field type

Add `VIDEO` as a new custom field type. Works like TEXT but renders a URL input with
an embed preview (reusing the existing `VideoEmbed` component). Stores the URL in
`textValue` on `CustomFormResponse` -- no new storage needed.

**Type addition:**
- `CustomFormFieldType`: add `"VIDEO"`
- `customFormFieldTypeSchema`: add `"VIDEO"`
- `FIELD_TYPE_LABELS`: `VIDEO: "Video link"`

**Rendering (custom-field-display.tsx):**
- New `VIDEO` case: renders `<Input type="url">` + `<VideoEmbed>` preview below
- Auto-prepend `https://` on blur (same pattern as system video field)

**Display (submission-info-panel.tsx):**
- New `VIDEO` case: render `VideoEmbed` using `answer.textValue` instead of plain text

**Form builder:**
- No special editor needed (no options, no maxFiles). Label + description + required toggle are sufficient.

## 2. System video field: single URL

Change from `videoUrls: text[]` to `videoUrl: text | null`.

**Database:**
- Rename column `video_urls` to `video_url`, change type from `text[]` to `text`
- Migration: take first element of existing array, or null

**Schema changes (`submission.ts`):**
- `videoUrls: z.array(httpUrl)` becomes `videoUrl: httpUrl.nullable().default(null)`
- Same for `updateSubmissionFormSchema`

**DB schema (`schema.ts`):**
- `videoUrls: text().array()` becomes `videoUrl: text()`

**Actions:**
- `create-submission.ts`: validate `videoUrl` instead of `videoUrls.length`
- `update-submission.ts`: use `videoUrl`
- `copy-submission-to-role.ts`: copy `videoUrl`
- `get-candidate.ts`, `get-production-submissions.ts`: return `videoUrl`

**Components:**
- `submission-form.tsx`: replace `VideoUrlEditor` with single `<Input>` + `<VideoEmbed>` preview
- `submission-edit-form.tsx`: same change
- `submission-form-preview.tsx`: already renders a single input (no change needed)
- `submission-info-panel.tsx`: render single `VideoEmbed` from `videoUrl` instead of mapping array

**Types (`submission-helpers.ts`):**
- `videoUrls: string[]` becomes `videoUrl: string | null`

**UI copy:**
- System field form description stays the same (already singular)
- Required validation: "A video link is required."

## 3. Toggle label to the right

In `custom-field-display.tsx`, the TOGGLE case currently renders label first, then
Switch. Swap the order so Switch is on the left and label+description on the right.

**Before:**
```
[Label + description]  [Switch]
```

**After:**
```
[Switch]  [Label + description]
```

## Files changed

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `VIDEO` to `CustomFormFieldType` |
| `src/lib/schemas/form-fields.ts` | Add `VIDEO` to enum |
| `src/lib/schemas/submission.ts` | `videoUrls` -> `videoUrl` (singular) |
| `src/lib/db/schema.ts` | `videoUrls` -> `videoUrl` column |
| `src/lib/submission-helpers.ts` | Update type |
| `src/components/submissions/custom-field-display.tsx` | Add VIDEO case, fix TOGGLE order |
| `src/components/submissions/submission-form.tsx` | Single video input |
| `src/components/productions/submission-edit-form.tsx` | Single video input |
| `src/components/productions/submission-info-panel.tsx` | VIDEO custom field display, single system video |
| `src/components/productions/form-fields-editor.tsx` | Add VIDEO label |
| `src/actions/submissions/create-submission.ts` | `videoUrl` singular |
| `src/actions/submissions/update-submission.ts` | `videoUrl` singular |
| `src/actions/submissions/copy-submission-to-role.ts` | `videoUrl` singular |
| `src/actions/candidates/get-candidate.ts` | `videoUrl` singular |
| `src/actions/productions/get-production-submissions.ts` | `videoUrl` singular |
| Migration file | Rename + convert column |

`video-url-editor.tsx` can be deleted (no longer used by anyone).
