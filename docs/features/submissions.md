# Public Submission Flow

> **Last verified:** 2026-04-05

## Overview

The public submission flow lets candidates discover and apply to casting calls without creating an account. Production teams share a clean URL (e.g., `/s/acme-theatre/spring-musical/lead-role`) and anyone can browse open productions, select roles, upload headshots and a resume, link audition videos, and submit. The flow also handles candidate deduplication, presigned file uploads to Cloudflare R2, and PDF text extraction for resumes.

**Who it serves:** Performers (candidates) submitting auditions; casting directors who share links and receive submissions.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/s/[orgSlug]` | `src/app/s/[orgSlug]/page.tsx` | None | Lists an org's open productions and their roles |
| `/s/[orgSlug]/[productionSlug]` | `src/app/s/[orgSlug]/[productionSlug]/page.tsx` | None | Two-column production page with roles context (left) + sticky submission form (right) |
| `/s/[orgSlug]/[productionSlug]/[roleSlug]` | `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | None | Redirects to the production page |
| `/s` (layout) | `src/app/s/layout.tsx` | None | Shared layout with Castparty footer branding; does not constrain content width — each page sets its own max-width |

All three pages are server components. Each resolves its entity by slug via unauthenticated server functions and renders a `NotFoundEntity` fallback if not found.

## Data Model

### Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `Organization` | `id`, `name`, `slug` (globally unique) | Slug is the first URL segment |
| `OrganizationProfile` | `id` (= org id), `isOrganizationProfileOpen`, `description`, `websiteUrl` | Controls whether the org page shows or displays a "not accepting" gate |
| `Production` | `id`, `organizationId`, `name`, `slug`, `status`, `location`, `submissionFormFields`, `systemFieldConfig` | Slug unique per org. Status must be `open` to appear publicly |
| `Role` | `id`, `productionId`, `name`, `slug`, `status` | Slug unique per production. Status must be `open` |
| `Candidate` | `id`, `organizationId`, `firstName`, `lastName`, `email`, `phone`, `location` | Unique constraint on `(organizationId, email)` for deduplication |
| `Submission` | `id`, `productionId`, `roleId`, `candidateId`, `stageId`, `sortOrder` (text), `answers`, `links`, `videoUrl` (text), `unionStatus` (text[]), `representation` (jsonb), `resumeText` | Contact info comes from `Candidate` via join; no denormalized copies |
| `File` | `id`, `submissionId`, `type` (`HEADSHOT`/`RESUME`), `url`, `key`, `path`, `filename`, `contentType`, `size`, `order` | Shared table; consumers filter by `type` |
| `PipelineStage` | `id`, `productionId`, `type` (`APPLIED`/`CUSTOM`/`SELECTED`/`REJECTED`) | New submissions land in the `APPLIED` stage |

### Key Relationships

- `Candidate` is org-scoped and deduplicated by `(organizationId, email)` via upsert.
- `Submission` stores no contact-info copies. All contact data (`firstName`, `lastName`, `email`, `phone`, `location`) is read from the `Candidate` row via join.
- `Submission.answers` stores custom form responses as JSONB (`CustomFormResponse[]`).
- `Submission.videoUrl` is a `text` column storing a single external video URL (YouTube, Vimeo, Google Drive, Dropbox, or custom). Videos are not hosted — only the URL is stored.
- `File` rows link to `Submission` via `submissionId`; headshots and resumes share the same table, distinguished by `type`.

## Key Files

| File | Purpose |
|------|---------|
| `src/app/s/layout.tsx` | Shared public layout with Castparty footer; no max-width constraint — pages set their own |
| `src/app/s/[orgSlug]/page.tsx` | Org page: lists productions with open roles |
| `src/app/s/[orgSlug]/[productionSlug]/page.tsx` | Production page: two-column layout with roles context + sticky form card |
| `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | Role page: redirects to production page |
| `src/actions/submissions/get-public-org.ts` | Fetches org by slug (no auth) |
| `src/actions/submissions/get-public-org-profile.ts` | Fetches org profile (open status, description, website); auto-creates if missing |
| `src/actions/submissions/get-public-productions.ts` | Lists open productions for an org |
| `src/actions/submissions/get-public-production.ts` | Fetches a production by org + slug, includes open roles |
| `src/actions/submissions/get-public-role.ts` | Fetches a role by production + slug, includes production's form config |
| `src/actions/submissions/create-submission.ts` | Core mutation: validates, upserts candidate, creates submissions, moves files, extracts resume text |
| `src/actions/submissions/presign-headshot-upload.ts` | Presigns R2 URLs for headshot uploads (JPEG/PNG/WebP/HEIC, max 20 MB each, max 10 files) |
| `src/actions/submissions/presign-resume-upload.ts` | Presigns an R2 URL for resume upload (PDF only, max 10 MB) |
| `src/actions/submissions/presign-custom-field-upload.ts` | Presigns R2 URLs for IMAGE/DOCUMENT custom field uploads (IMAGE: JPEG/PNG/WebP/HEIC ≤20 MB; DOCUMENT: PDF ≤10 MB; up to 20 files per call); stores under `temp/custom-fields/` |
| `src/actions/submissions/reorder-submission.ts` | Updates `Submission.sortOrder` for drag-to-reorder; uses `secureActionClient` with org ownership check |
| `src/actions/submissions/bulk-send-email.ts` | Sends a custom email to all selected submissions via `sendBatchEmail`; writes `Email` rows for the activity log |
| `src/components/submissions/submission-form.tsx` | Client component: the full submission form with file uploads, wrapped in a card with grouped sections |
| `src/components/submissions/collapsible-description.tsx` | Client component: sanitized HTML description with line-clamp-3 and "Show more/Show less" toggle |
| `src/components/submissions/floating-apply-button.tsx` | Client component: mobile floating "Go to form" CTA using IntersectionObserver |
| `src/components/submissions/resume-uploader.tsx` | Controlled PDF file picker with remove button |
| `src/components/submissions/custom-field-display.tsx` | Renders a single custom field by type |
| `src/lib/r2.ts` | R2 utility: presign, upload, move, delete, check existence |
| `src/components/submissions/video-embed.tsx` | Shared embed component (YouTube, Vimeo, Google Drive, Dropbox, fallback) |
| `src/lib/video-embed.ts` | Pure utility: URL → platform detection + embed URL |
| `src/lib/schemas/submission.ts` | Zod schemas: `submissionFormSchema`, `submissionActionSchema`, file schemas |
| `src/lib/slug.ts` | `nameToSlug`, `validateSlug`, `generateUniqueSlug` |
| `src/hooks/use-city-options.ts` | Lazy-loads US + Canadian city names for autocomplete |
| `src/components/common/autocomplete-input.tsx` | Free-form combobox used for location fields |

## How It Works

### URL Resolution

```
Browser hits /s/acme-theatre/spring-musical/lead-role
  │
  ├── getPublicOrg("acme-theatre")        → { id, name, slug }
  ├── getPublicProduction(orgId, "spring-musical")
  │     └── includes open roles with their slugs
  └── getPublicRole(productionId, "lead-role")
        └── includes production.submissionFormFields + systemFieldConfig
```

Each page validates its entity exists and its status is `open`; otherwise renders `NotFoundEntity`.

### Submission Data Flow

```
SubmissionForm (client)
  ├── User fills out: name, email, phone, location, custom fields, video URLs, links
  ├── User uploads headshots via HeadshotUploader
  ├── User uploads resume via ResumeUploader
  ├── User uploads IMAGE/DOCUMENT custom field files via presign-custom-field-upload
  └── User adds a single video URL (inline embed preview via VideoEmbed)
        │
        ▼  on form submit
  1. Client-side validation (Zod + required custom field walk)
  2. Presign headshot uploads → PUT each file to R2 temp/headshots/
  3. Presign resume upload → PUT file to R2 temp/resumes/
  4. Presign IMAGE/DOCUMENT custom field uploads → PUT each file to R2 temp/custom-fields/
  5. action.execute({ ...formValues, orgId, productionId, roleIds, headshots, resume, customFieldFiles })
        │
        ▼  createSubmission (server action via publicActionClient)
  6. Server validation (roles exist + open, production open, required fields)
  7. Transform flat answers → CustomFormResponse[]
  8. Move files from temp/ to permanent R2 storage
  9. Database transaction (atomic):
     ├── Upsert Candidate by (organizationId, email)
     ├── Insert Submission(s) — one per roleId
     ├── Insert File rows for headshots (per submission)
     ├── Insert File row for resume (per submission)
     └── Insert File rows for custom field uploads (per submission)
  10. PDF text extraction (best-effort, outside transaction)
  11. Send submission-received emails (fire-and-forget)
```

### Multi-Role Submission

When a production has multiple open roles, the form shows checkboxes for role selection. The initial role is pre-selected. On submit, one `Submission` row is created per selected role, all sharing the same `Candidate` record, file uploads, and `videoUrl`.

### R2 File Storage

`src/lib/r2.ts` wraps the AWS SDK `S3Client` pointing at Cloudflare's R2 endpoint. Key layout:

```
{dev|prod}/temp/headshots/{fileId}.{ext}         ← staging area (presigned uploads land here)
{dev|prod}/temp/resumes/{fileId}.pdf
{dev|prod}/temp/custom-fields/{fileId}.{ext}
{dev|prod}/headshots/{fileId}.{ext}              ← permanent storage (after move)
{dev|prod}/resumes/{fileId}.pdf
{dev|prod}/custom-fields/{fileId}.{ext}
```

Functions: `createPresignedUploadUrl`, `uploadFile`, `deleteFile`, `moveFile`, `moveFileByKey`, `checkFileExists`, `getKeyFromUrl`.

Environment variables: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

### Resume PDF Text Extraction

Uses `unpdf` (zero-dependency, edge-compatible) instead of `pdf-parse` (which conflicts with Next.js bundler). The extraction step is wrapped in try/catch outside the database transaction -- if parsing fails, `resumeText` stays `null` and the submission still succeeds.

### Location Fields and City Autocomplete

Location is a free-text field (max 200 chars) on both `Production` and `Submission`. The `useCityOptions` hook lazy-loads ~32,700 US + Canadian city names from `public/us-cities.json` and `public/can-cities.json`, cached at the module level. `AutocompleteInput` provides a filtered dropdown (prefix match, min 2 chars, max 20 results) but accepts any typed value.

### URL Slugs

Slugs are auto-generated from entity names via `nameToSlug()`: lowercase, hyphens for non-alphanumeric, truncated to 40 chars, with an 8-character CUID suffix for uniqueness. Validation: 3-60 chars, lowercase alphanumeric + hyphens, not purely numeric, not in the reserved slugs set. Uniqueness enforced by database indexes:
- `Organization.slug` -- globally unique
- `Production.(organizationId, slug)` -- unique per org
- `Role.(productionId, slug)` -- unique per production

## Business Logic

- **No auth required.** All public server functions use `publicActionClient`.
- **Org profile gate.** If `isOrganizationProfileOpen` is false, the org page shows a "not accepting auditions" message.
- **Status checks.** Productions and roles must have `status: "open"` to appear publicly. Server action double-checks.
- **Candidate deduplication.** `INSERT ... ON CONFLICT (organizationId, email) DO UPDATE` ensures one candidate per email per org. The candidate row is updated with the latest contact info on each submission.
- **No denormalized contact fields.** `Submission` holds no copies of `firstName`, `lastName`, `email`, `phone`, or `location`. Contact data is always read from the joined `Candidate` row.
- **System field visibility.** `SystemFieldConfig` controls whether phone, location, headshots, resume, video, links, union status, and representation are hidden, optional, or required. See [Custom Fields](./custom-fields.md) for the full config.
- **Video URL validation.** The video URL schema is `httpUrl.or(z.literal("")).optional()`. The `VideoEmbed` component detects YouTube, Vimeo, Google Drive, and Dropbox URLs for inline embed previews; unknown URLs get a fallback warning but are still accepted.
- **Video copy on clone.** `copy-submission-to-role` copies `videoUrl` along with other submission data.
- **File validation.** Headshots: JPEG/PNG/WebP/HEIC, max 20 MB each, max 10 files. Resume: PDF only, max 10 MB.
- **Temp key prefix validation.** `create-submission` verifies file keys start with `temp/` before moving.

## UI States

| State | Behavior |
|-------|----------|
| Org not found | `NotFoundEntity` with "organization" message |
| Org profile closed | "Not accepting auditions" empty state with lock icon |
| No open productions | "No open auditions" empty state |
| Production not found or closed | `NotFoundEntity` with "production" message |
| No open roles | "No roles listed" empty state |
| Role not found or closed | `NotFoundEntity` with "role" message |
| Uploading files | Button shows "Uploading files..." with loading spinner |
| Submitting | Button shows loading state |
| Upload error | Error message below the headshot/resume uploader |
| Server error | Destructive Alert at bottom of form |
| Video URL entered | Inline embed preview (YouTube/Vimeo/Google Drive/Dropbox) or fallback warning for unknown platforms |
| Success | Alert with "Submission received" + link to browse other roles |

## Integration Points

- [Custom Fields](./custom-fields.md) -- `submissionFormFields` from `Production` are rendered in the submission form.
- [Pipeline Stages](./pipeline.md) -- New submissions land in the `APPLIED` stage.
- [Email](./email.md) -- `sendSubmissionEmail` fires a "submission received" email after successful submission.
- [Kanban](./kanban.md) -- Where casting directors view and triage submissions.
- [Candidates](./candidates.md) -- `Candidate` records are reused across submissions in the same org.

## Architecture Decisions

- **Two-phase upload (presign then move).** Client uploads files directly to R2 via presigned URLs, bypassing the Next.js server. Avoids the 4 MB serverless body limit. `temp/` prefix acts as staging area.
- **`unpdf` over `pdf-parse`.** `pdf-parse` requires bundler workarounds that conflict with Next.js. `unpdf` is zero-dependency and edge-compatible. (ADR-008)
- **`resumeText` on `Submission`, not `File`.** A submission has at most one resume and the text is a property of the application, not the file asset.
- **`files` relation instead of `headshots`.** Named generically so new file types slot in without renames. Consumers filter by `type`.
- **Candidate deduplication by email.** Same person submitting to multiple roles = one candidate. Contact info on the candidate row is updated on each submission (via upsert).
- **Free-text location.** Max 200 chars on the candidate row. Non-standard values work without schema changes.
- **Video URLs stored, not video files.** Videos are hosted externally (YouTube, Vimeo, Google Drive, Dropbox) to avoid storage costs. Only a single URL is stored in `videoUrl: text`. Embed previews are generated client-side via platform detection.
- **Module-level city cache.** `useCityOptions` uses a module-level `Promise` instead of React context.
