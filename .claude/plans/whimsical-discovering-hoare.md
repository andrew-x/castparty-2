# Plan: IMAGE & DOCUMENT Custom Form Field Types

## Context

Casting directors need to collect images and documents beyond the built-in headshots/resume fields. For example, a production might want costume reference photos, proof of union membership, or signed consent forms. Two new custom form field types — IMAGE (multiple images, configurable max) and DOCUMENT (single PDF) — let casting directors add these to their submission forms alongside existing text/select/toggle fields.

---

## Step 1: Type & Schema Foundation

**Subagent:** code-architect (one agent, straightforward changes)

### `src/lib/types.ts`

- Add `"IMAGE" | "DOCUMENT"` to `CustomFormFieldType` union
- Add `maxFiles?: number` to `CustomForm` interface (for IMAGE, default 5)
- Add `fileValues: string[] | null` to `CustomFormResponse` interface

### `src/lib/schemas/form-fields.ts`

- Add `"IMAGE"`, `"DOCUMENT"` to `customFormFieldTypeSchema` z.enum
- Add `maxFiles: z.number().int().min(1).max(20).optional()` to `customFormItemSchema`
- Add `maxFiles` to `updateProductionFormFieldSchema`

### `src/lib/schemas/submission.ts`

- Define `customFieldFileSchema` (same shape as `headShotFileSchema`: key, filename, contentType, size)
- Add `customFieldFiles: z.record(z.string(), z.array(customFieldFileSchema)).default({})` to `submissionActionSchema`

---

## Step 2: Database Schema & Migration

**Subagent:** code-architect (one agent)

### `src/lib/db/schema.ts`

- Add `"CUSTOM_FIELD"` to `fileTypeEnum`: `["HEADSHOT", "RESUME", "VIDEO", "CUSTOM_FIELD"]`
- Add `formFieldId: text()` column to `File` table (nullable — only used for CUSTOM_FIELD type)
- Add index: `index("file_formFieldId_idx").on(table.formFieldId)`

### Migration

- Run `bun run db:update` to generate and apply migration
- Migration will: ALTER TYPE, ADD COLUMN, CREATE INDEX

---

## Step 3: Presign Action

**Subagent:** code-architect (one agent)

### Create `src/actions/submissions/presign-custom-field-upload.ts`

Follow pattern of `presign-headshot-upload.ts`. Single action for both types:

- Input schema: `{ fieldType: z.enum(["IMAGE", "DOCUMENT"]), files: z.array({filename, contentType, size}).min(1).max(20) }`
- IMAGE validation: contentType in JPEG/PNG/WebP/HEIC, size <= 20MB
- DOCUMENT validation: contentType = application/pdf, size <= 10MB
- Temp key: `${r2Root}/temp/custom-fields/${generateId("file")}.${ext}`
- Returns `{ files: [{ key, presignedUrl }] }`

Reuse: `createPresignedUploadUrl`, `r2Root`, `generateId` from existing code.

---

## Step 4: Upload Component Tweaks

**Subagent:** code-architect (one agent, minimal changes)

### `src/components/submissions/headshot-uploader.tsx`

- Add `showPrimary?: boolean` prop (default `true`)
- When `showPrimary` is false: skip the star icon on first image, skip "first image is your main headshot" text
- Pass `showPrimary` down to `SortableThumbnail`

### `src/components/submissions/resume-uploader.tsx`

- Add `placeholder?: string` prop (default `"Add resume (PDF)"`)
- Use it in the empty-state button label

---

## Step 5: Form Builder UI (Casting Director)

**Subagent:** code-architect (one agent)

### `src/components/productions/form-fields-editor.tsx`

- Add to `FIELD_TYPE_LABELS`: `IMAGE: "Image upload"`, `DOCUMENT: "Document upload"`
- Add `maxFiles?: number` to `FieldDraft` interface
- Include `maxFiles` in `draftFromField`, `handleSave`, and `hasChanges`
- In `SortableField` expanded editor: show "Max images" number input when `field.type === "IMAGE"`
- In collapsed row: show `max {field.maxFiles ?? 5}` badge for IMAGE fields

### `src/actions/productions/add-production-form-field.ts`

- When type is `"IMAGE"`, set `maxFiles: 5` as default on the new field object

### `src/actions/productions/update-production-form-field.ts`

- Already spreads `...updates` — just ensure the schema accepts `maxFiles` (done in Step 1)

---

## Step 6: Submission Form (Performer Side)

**Subagent:** code-architect (one agent — this is the heaviest integration)

### `src/components/submissions/custom-field-display.tsx`

Extend Props interface:
```
files?: HeadshotFile[]
onFilesChange?: (files: HeadshotFile[]) => void
documentFile?: File | null
onDocumentChange?: (file: File | null) => void
fileError?: string
```

Add two new switch cases:
- `"IMAGE"`: render `HeadshotUploader` with `showPrimary={false}`, `maxFiles={field.maxFiles ?? 5}`
- `"DOCUMENT"`: render `ResumeUploader` with custom placeholder

### `src/components/submissions/submission-form.tsx`

State additions:
- `customFieldImages: Record<string, HeadshotFile[]>` — map fieldId → image files
- `customFieldDocuments: Record<string, File | null>` — map fieldId → document
- `customFieldFileErrors: Record<string, string | null>` — map fieldId → error

Custom field rendering: branch on `formField.type`:
- IMAGE/DOCUMENT: render `CustomFieldDisplay` with file props (not wrapped in `Controller`)
- Other types: existing `Controller`-based rendering

Client-side validation: check required IMAGE/DOCUMENT fields have files

Upload flow (after headshot/resume uploads):
- Loop through IMAGE/DOCUMENT fields
- Call `presignCustomFieldUpload` for each
- Upload to R2 via presigned URLs
- Build `customFieldFileMeta: Record<string, FileMeta[]>`

Pass `customFieldFiles: customFieldFileMeta` to `action.execute()`

---

## Step 7: Create Submission Server Action

**Subagent:** code-architect (one agent)

### `src/actions/submissions/create-submission.ts`

Destructure `customFieldFiles` from parsedInput.

Required field validation: add IMAGE/DOCUMENT cases checking for files.

Move custom field files from temp → permanent:
```
for each [fieldId, files] in customFieldFiles:
  validate keys start with ${r2Root}/temp/custom-fields/
  checkFileExists for each
  moveFileByKey to "custom-fields" folder
```

Build `formResponses` — for IMAGE/DOCUMENT fields, populate `fileValues` with moved URLs:
```
case "IMAGE":
case "DOCUMENT":
  return { fieldId, textValue: null, booleanValue: null, optionValues: null,
           fileValues: movedFiles.map(f => f.url) }
```

Insert File records in transaction:
```
for each [fieldId, files] in movedCustomFieldFiles:
  insert File with type: "CUSTOM_FIELD", formFieldId: fieldId
```

---

## Step 8: Submission Display (Drawer)

**Subagent:** code-architect (one agent)

### `src/lib/submission-helpers.ts`

Add to `SubmissionWithCandidate`:
```
customFieldFiles: Record<string, { id: string; url: string; filename: string; contentType: string }[]>
```

### `src/actions/productions/get-production-submissions.ts`

After extracting headshots/resume from `allFiles`, group CUSTOM_FIELD files by `formFieldId`:
```
const customFieldFiles = {}
for (const f of allFiles.filter(f => f.type === "CUSTOM_FIELD" && f.formFieldId)):
  customFieldFiles[f.formFieldId] ??= []
  customFieldFiles[f.formFieldId].push({ id, url, filename, contentType })
```

Include `customFieldFiles` in each submission object.

### `src/components/productions/submission-info-panel.tsx`

In the "Form responses" section, update the loop:
- IMAGE: render thumbnail grid (3 columns) with lightbox. Add `customFieldLightbox: { fieldId, index } | null` state alongside existing `lightboxIndex`.
- DOCUMENT: render download link with `FileTextIcon`, matching resume display pattern
- Other types: existing text rendering

---

## Step 9: Form Preview & Copy Submission

**Subagent:** code-architect (one agent, lightweight)

### `src/components/productions/submission-form-preview.tsx`

Branch on `field.type` before falling through to `CustomFieldDisplay`:
- IMAGE: dashed-border placeholder + "Up to N images" text
- DOCUMENT: dashed-border placeholder

### `src/actions/submissions/copy-submission-to-role.ts`

Add `formFieldId: f.formFieldId` to the file copy map (line ~106).

---

## Files Summary

### New (1)
| File | Purpose |
|------|---------|
| `src/actions/submissions/presign-custom-field-upload.ts` | Presign action for custom field file uploads |

### Modified (15)
| File | Changes |
|------|---------|
| `src/lib/types.ts` | IMAGE/DOCUMENT type, maxFiles, fileValues |
| `src/lib/schemas/form-fields.ts` | Enum + maxFiles in schemas |
| `src/lib/schemas/submission.ts` | customFieldFileSchema, customFieldFiles on action schema |
| `src/lib/db/schema.ts` | CUSTOM_FIELD enum, formFieldId column |
| `src/lib/submission-helpers.ts` | customFieldFiles on SubmissionWithCandidate |
| `src/components/submissions/custom-field-display.tsx` | IMAGE/DOCUMENT switch cases |
| `src/components/submissions/submission-form.tsx` | File state, validation, upload flow |
| `src/components/submissions/headshot-uploader.tsx` | showPrimary prop |
| `src/components/submissions/resume-uploader.tsx` | placeholder prop |
| `src/components/productions/form-fields-editor.tsx` | Type labels, maxFiles editor |
| `src/components/productions/submission-form-preview.tsx` | IMAGE/DOCUMENT preview |
| `src/components/productions/submission-info-panel.tsx` | Image grid + lightbox, document download |
| `src/actions/productions/add-production-form-field.ts` | Default maxFiles for IMAGE |
| `src/actions/submissions/create-submission.ts` | Custom field file handling |
| `src/actions/productions/get-production-submissions.ts` | Group CUSTOM_FIELD files |
| `src/actions/submissions/copy-submission-to-role.ts` | Include formFieldId in copy |

### Generated (1)
| File | Purpose |
|------|---------|
| Migration SQL | ALTER TYPE, ADD COLUMN, CREATE INDEX |

---

## Implementation Order

Steps 1-2 first (foundation). Then 3-5 in parallel (presign, upload tweaks, form builder). Then 6-7 (submission form + server action). Then 8-9 (display + cleanup).

## Verification

1. **Form builder:** Go to production settings > submission form. Add an IMAGE field and a DOCUMENT field. Verify the type dropdown shows "Image upload" and "Document upload". Verify IMAGE field shows max images config. Toggle required on both.
2. **Preview:** Check the form preview shows placeholder areas for both field types.
3. **Submission form:** Visit the public audition page. Verify IMAGE field renders an image uploader (no star icon). Verify DOCUMENT field renders a PDF upload area. Try submitting with required fields empty — should show errors. Upload files and submit successfully.
4. **Submission drawer:** Open the submission in the Kanban view. Verify IMAGE answers show as thumbnail grid with working lightbox. Verify DOCUMENT answers show as download links.
5. **Copy submission:** Copy a submission with custom field files to another role. Verify files appear on the copy.
6. **Build check:** Run `bun run build` — no TypeScript errors.
7. **Lint check:** Run `bun run lint` — no Biome errors.
