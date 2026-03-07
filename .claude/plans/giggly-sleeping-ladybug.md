# Resume Upload for Submissions

## Context

Submissions currently support headshot uploads but not resumes. The `File` table already has a `RESUME` type in the `fileTypeEnum`, and `pdf-parse` is installed but unused. We need to add a single-file resume upload to the submission flow, parse the PDF to extract text after upload, store that text on the `Submission` record, and show a link to the resume in the review UI.

## Plan

### 1. Add `resumeText` column to `Submission` table

**File:** `src/lib/db/schema.ts` (line ~391)

- Add `resumeText: text()` column to the `Submission` table (nullable, no default)
- Generate and run a Drizzle migration

### 2. Add resume file schema

**File:** `src/lib/schemas/submission.ts`

- Add `resumeFileSchema` (similar to `headShotFileSchema` but for a single file):
  ```ts
  export const resumeFileSchema = z.object({
    key: z.string().min(1),
    filename: z.string().min(1),
    contentType: z.string().min(1),
    size: z.number().int().positive().max(10 * 1024 * 1024), // 10MB
  })
  ```
- Add `resume` field to `submissionActionSchema`: `resume: resumeFileSchema.optional()`

### 3. Create presign action for resume uploads

**File:** `src/actions/submissions/presign-resume-upload.ts` (new)

- Mirror `presign-headshot-upload.ts` but for a single PDF file
- Allowed MIME types: `application/pdf`
- Max file size: 10MB
- Single file (not an array)
- Temp path: `{r2Root}/temp/resumes/{fileId}.pdf`

### 4. Update `createSubmission` to handle resume

**File:** `src/actions/submissions/create-submission.ts`

- Accept `resume` from `parsedInput`
- After creating the submission, if `resume` is provided:
  1. Validate key starts with temp prefix (`{r2Root}/temp/resumes/`)
  2. Move from temp to permanent `resumes/` folder via `moveFileByKey`
  3. Insert a `File` record with type `"RESUME"`
  4. Fetch the PDF from R2 using its public URL
  5. Parse with `pdf-parse` to extract text
  6. Update the submission's `resumeText` column with the extracted text

### 5. Add `ResumeUploader` component

**File:** `src/components/submissions/resume-uploader.tsx` (new)

- Simpler than `HeadshotUploader` — single file, no reordering
- Accept: `application/pdf` only
- Shows filename + remove button when a file is selected
- Props: `file: File | null`, `onChange: (file: File | null) => void`, `error?: string`

### 6. Update `SubmissionForm` to include resume upload

**File:** `src/components/submissions/submission-form.tsx`

- Add state: `const [resume, setResume] = useState<File | null>(null)`
- In `onSubmit`, after headshot upload logic, add resume upload:
  1. Call `presignResumeUpload` to get presigned URL
  2. Upload PDF to R2 via PUT
  3. Build `resumeMeta` object
- Pass `resume: resumeMeta` to `action.execute()`
- Add `<ResumeUploader>` field after the headshot uploader
- Update loading text to include resume upload state

### 7. Add resume data to `SubmissionWithCandidate` type

**File:** `src/lib/submission-helpers.ts`

- Add `ResumeData` interface: `{ id: string; url: string; filename: string }`
- Add `resume: ResumeData | null` to `SubmissionWithCandidate`
- Add `resumeText: string | null` to `SubmissionWithCandidate`

### 8. Update data fetching to include resume

**File:** `src/actions/productions/get-role-with-submissions.ts`

- The `headshots` relation already fetches all `File` records. Since Drizzle relations use `many(File)`, resume files will already be included. We need to either:
  - Filter files by type in the query or post-query to separate headshots from resumes
  - The relation is called `headshots` but returns all files — we'll filter client-side or add a where clause

**Approach:** In the submission query, the `headshots` relation returns ALL files. We'll post-process: filter `type === "HEADSHOT"` for headshots and find `type === "RESUME"` for the resume. This avoids schema relation changes.

### 9. Show resume link in submission detail sheet

**File:** `src/components/productions/submission-detail-sheet.tsx`

- After the headshots section, add a "Resume" section
- Show the resume filename as a link that opens in a new tab (to the R2 URL)
- Use a `FileTextIcon` from lucide-react for the icon
- Optionally show a collapsible section with `resumeText` preview

## Files Modified

| File | Change |
|------|--------|
| `src/lib/db/schema.ts` | Add `resumeText` column to `Submission` |
| `src/lib/schemas/submission.ts` | Add `resumeFileSchema`, extend action schema |
| `src/actions/submissions/presign-resume-upload.ts` | **New** — presign action for PDF upload |
| `src/actions/submissions/create-submission.ts` | Handle resume upload, parse PDF, store text |
| `src/components/submissions/resume-uploader.tsx` | **New** — single-file PDF uploader component |
| `src/components/submissions/submission-form.tsx` | Add resume uploader + upload logic |
| `src/lib/submission-helpers.ts` | Add `ResumeData`, update `SubmissionWithCandidate` |
| `src/actions/productions/get-role-with-submissions.ts` | Filter files by type |
| `src/components/productions/submission-detail-sheet.tsx` | Show resume link |
| Drizzle migration file | Generated migration for `resumeText` column |

## Verification

1. Run `bun run build` to verify no type errors
2. Run `bun run lint` to verify Biome compliance
3. Manual testing:
   - Visit a role submission page (`/s/[org]/[prod]/[role]`)
   - Upload a PDF resume and submit
   - Verify the file appears in R2 under `resumes/`
   - Check the database: `File` record with type `RESUME` exists, `Submission.resumeText` is populated
   - Open the submission detail sheet — resume link should open the PDF in a new tab
