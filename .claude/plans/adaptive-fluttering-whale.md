# Headshots Upload Feature

## Context

Candidates submitting auditions need to upload headshots — the primary visual identifier in performing arts casting. Currently the submission form only handles text-based fields. This feature adds file upload support starting with headshots, with a schema designed to support resumes and video in the future.

Headshots are **submission-level** (uploaded per submission) but aggregated at the candidate level for display. The first headshot in order is the primary/thumbnail image.

## Design Summary

- **Files table** in the DB schema with a type enum (`HEADSHOT`, future: `RESUME`, `VIDEO`)
- **Presigned URL upload** — files go directly from browser to R2, never through the Next.js server
- **Orderable thumbnails** — dnd-kit (already installed) for reorder; first image = primary
- **Max 10 images**, 20MB per file, image MIME types only
- **DB records created only on form submission** — orphaned R2 files from abandoned forms can be cleaned up later via lifecycle rules

## Schema: `File` table

```
File table (src/lib/db/schema.ts):
  id          text PK
  submissionId text FK → Submission (cascade delete)
  type        enum: HEADSHOT (future: RESUME, VIDEO)
  url         text — R2 public URL
  key         text — R2 object key (for deletion)
  path        text — R2 key path (e.g. "prod/headshots/file-abc123.jpg")
  filename    text — original filename
  contentType text — MIME type
  size        integer — bytes
  order       integer — display order (0 = primary)
  createdAt   timestamp
```

Relations: `Submission` has many `File`; add `files: many(File)` to `submissionRelations`.

## Orphan Cleanup: Temp/Permanent Prefix Strategy

Files upload to a `temp/` prefix in R2 during the form session. On successful submission, the server action moves them to the permanent prefix (`prod/headshots/` or `dev/headshots/`). An **R2 lifecycle rule** auto-deletes objects under `temp/` after 24 hours, cleaning up abandoned uploads with zero application code.

- Presigned URLs target: `{dev|prod}/temp/headshots/{cuid}.{ext}`
- On submit, server moves to: `{dev|prod}/headshots/{cuid}.{ext}` (using existing `moveFile()`)
- R2 lifecycle rule: delete `*/temp/*` after 1 day (configured in Cloudflare dashboard, not in code)

## Upload Flow

```
1. User selects images → local blob URL previews
2. User reorders via drag-and-drop, removes unwanted
3. User clicks "Submit audition"
4. Client calls presign route → gets presigned PUT URLs for each file (temp/ prefix)
5. Client uploads all files to R2 in parallel via PUT
6. Client calls createSubmission action with file metadata (keys, filenames, sizes, contentTypes, order)
7. Server action moves files from temp/ to permanent prefix, creates Candidate + Submission + File records
```

## Files to Create/Modify

### New files
1. **`src/lib/db/file-type-enum.ts`** — not needed, define enum inline in schema.ts
2. **`src/app/api/upload/presign/route.ts`** — POST route handler, accepts `{ files: [{filename, contentType, size}] }`, validates (image MIME, ≤20MB, ≤10 files), returns presigned PUT URLs + generated keys
3. **`src/components/submissions/headshot-uploader.tsx`** — client component with drop zone, thumbnail grid, dnd-kit reorder, remove button, star indicator on first item

### Modified files
4. **`src/lib/db/schema.ts`** — add `fileTypeEnum`, `File` table, `fileRelations`, update `submissionRelations`
5. **`src/lib/r2.ts`** — add `createPresignedUploadUrl(key, contentType)` using `@aws-sdk/s3-request-presigner`
6. **`src/lib/schemas/submission.ts`** — add `headshots` array field to form/action schemas (array of `{key, filename, contentType, size}`)
7. **`src/components/submissions/submission-form.tsx`** — integrate `HeadshotUploader`, pass file metadata on submit
8. **`src/actions/submissions/create-submission.ts`** — insert `File` records after creating submission
9. **`src/components/productions/submission-detail-sheet.tsx`** — display headshot thumbnails when viewing a submission

### Package to install
- `@aws-sdk/s3-request-presigner` — for generating presigned PUT URLs

## Key Implementation Details

### Presign route (`/api/upload/presign`)
- Public route (no auth — matches public submission form)
- Validates: image MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/heic`), file size ≤ 20MB, count ≤ 10
- Generates keys under temp prefix: `{dev|prod}/temp/headshots/{cuid}.{ext}`
- Returns: `{ files: [{ key, presignedUrl }] }`
- Presigned URL expiry: 10 minutes

### HeadshotUploader component
- Drop zone with click-to-browse (uses native `<input type="file">` hidden behind a styled area)
- `accept="image/jpeg,image/png,image/webp,image/heic"`
- Shows thumbnail grid from local blob URLs (no R2 upload yet)
- dnd-kit sortable grid — reorder by dragging
- First item shows a star icon with tooltip: "This will be your main headshot"
- Remove button (X) on each thumbnail
- Exposes `files: File[]` and `order: number[]` to parent via callback
- Validation: shows error if >10 files or any file >20MB

### Form submission flow
- `submission-form.tsx` holds headshot `File[]` in local state (not in react-hook-form — files can't serialize to form schema)
- On submit: (1) request presigned URLs, (2) upload to R2, (3) call server action with file metadata
- Show upload progress indicator during presign+upload phase
- If any upload fails, show error, don't submit

### Server action changes
- `submissionActionSchema` gains `headshots` array: `z.array(z.object({ key, filename, contentType, size }))`
- After inserting Submission: move each file from `temp/` to permanent prefix via `moveFile()`, then bulk-insert File records with `submissionId`, `type: "HEADSHOT"`, `path`, and `order` matching array index

### Migration
- Run `bun run db:generate` after schema changes to create migration
- Run `bun run db:push` to apply

## Reusable Patterns & Utilities

- **dnd-kit**: Already used in `form-fields-editor.tsx` and `role-submissions.tsx` — follow same `useSortable` pattern
- **R2 client**: Existing `src/lib/r2.ts` S3Client instance — add presigner on same client
- **`generateId("file")`**: Existing ID generator in `src/lib/util.ts`
- **Field/FieldLabel/FieldError**: Existing form field components in `src/components/common/field.tsx`
- **Design tokens**: `gap-element`, `gap-block`, `gap-group` for spacing; `text-label`, `text-caption` for text

## Verification

1. **Schema**: Run `bun run db:generate` — should create a clean migration adding `file_type` enum and `file` table
2. **Presign route**: `curl -X POST /api/upload/presign` with file metadata — should return presigned URLs
3. **Upload UI**: Visit a role's submission page, upload images, verify thumbnails render, drag to reorder, remove works
4. **Submit**: Fill form + headshots → submit → verify File records created in DB with correct order and URLs
5. **View**: Open submission detail sheet → headshot thumbnails should display
6. **Edge cases**: Try >10 files (blocked), >20MB file (blocked), non-image file (blocked), submit with 0 headshots (allowed — headshots are optional)
7. **Build**: `bun run build` passes
8. **Lint**: `bun run lint` passes
