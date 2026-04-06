# Doc Sync Plan — 2026-04-05

## Summary of findings

Three docs need updates: `docs/ARCHITECTURE.md`, `docs/features/README.md`.
`docs/CONVENTIONS.md` is current — no changes needed.

---

## 1. ARCHITECTURE.md — Known Issues table

### Issue #1 — FIXED
Current: "getCandidate fetches the candidate row before checking candidate.organizationId !== orgId"
Reality: `src/actions/candidates/get-candidate.ts` line 21 now uses `and(eq(c.id, candidateId), eq(c.organizationId, orgId))` — the org filter is applied at the DB level. Close it.

### Issue #3 — FIXED
Current: "Required-field validation for TOGGLE and CHECKBOX_GROUP... The TOGGLE case means a required toggle cannot be enforced."
Reality: `src/actions/submissions/create-submission.ts` lines 175-184 now correctly handle:
- TOGGLE: `if (value !== "true") throw new Error(...)`
- CHECKBOX_GROUP: splits on comma, filters empty, checks length
Close it.

### Issue #10 — UPDATE (still open, but incomplete)
Current: "Auth schemas (src/lib/schemas/auth.ts) intentionally use bare "zod""
Reality: `src/lib/action.ts` line 5 also uses bare `import { z } from "zod"` (for the metadata schema). The documented exception only lists auth.ts — needs to also list action.ts.

---

## 2. ARCHITECTURE.md — Data Model section

### user table
Add `firstName`, `lastName` columns (added in commit #77 "Split user name into firstName and lastName fields").

### Production table
Add `description` (text, notNull, default "") and `banner` (text, nullable) to documented columns.
The `systemFieldConfig` JSONB shape is also stale — the actual type now includes `video`, `links`, `unionStatus`, `representation` fields (with hidden/optional/required or hidden/optional-only visibility).

### Role table
Add `referencePhotos` (JSONB string[], notNull, default []) column. This was added with the branding controls feature (commit #62).

### Submission table
Major drift — several fields are missing or wrong:
- REMOVE: `firstName`, `lastName`, `email`, `phone`, `location` — these were removed in commit #75 "Remove denormalized candidate info from submissions". The ARCHITECTURE.md still documents them.
- ADD: `sortOrder` (text, notNull, default ""), `videoUrl` (text, nullable), `unionStatus` (text[], notNull), `representation` (JSONB Representation|null), `resumeText` (text, nullable) — all present in schema but not documented.
- UPDATE: `answers` type is `CustomFormResponse[]` (not just "JSONB") — `CustomFormResponse` has `fieldId`, `textValue`, `booleanValue`, `optionValues`, `fileValues` fields.
The "Submission denormalization" note needs to be removed or revised — the snapshot fields no longer exist.

### File table
- ADD: `CUSTOM_FIELD` to the type enum values
- ADD: `formFieldId` (text, nullable) — links a custom field file to the form field that collected it

### src/lib/types.ts entry
Update to reflect actual exports:
- `CustomFormFieldType` now includes IMAGE, DOCUMENT, VIDEO (in addition to TEXT, TEXTAREA, SELECT, CHECKBOX_GROUP, TOGGLE)
- `SystemFieldConfig` now includes `video`, `links`, `unionStatus`, `representation`
- Add: `RestrictedFieldVisibility` type
- Add: `Representation` interface (name, email, phone)
- Add: `EmailTemplates` and `EmailTemplate` interfaces
- Add: `UNION_OPTIONS`, `SYSTEM_FIELD_ALLOWED_VISIBILITIES` constants

---

## 3. features/README.md — Missing routes

The build shows 33 routes (page.tsx + route.ts files). The README covers most but misses:

### Missing entries
1. `src/app/(app)/settings/account/page.tsx` — Account settings (name, email, password)
2. `src/app/(app)/settings/members/page.tsx` — Members management (was previously merged into the settings page, now a separate route)
3. `src/app/s/[orgSlug]/[productionSlug]/page.tsx` — Production public page (shows production info + roles, embeds submission form). Currently only `[roleSlug]` level is documented.

### Feature additions from recent commits
4. Candidate Merge — commit #74 "Add candidate merge feature" → `docs/features/candidates.md`
5. Table View mode for submissions board — commit #73 "Add table view mode to submissions board" → `docs/features/kanban.md`
6. Bulk Send Email — commit #78 "Add bulk send email action to submissions board" → `docs/features/email.md` and/or `kanban.md`

---

## Edit plan

### Edit 1: ARCHITECTURE.md Known Issues — close #1 and #3, update #10
### Edit 2: ARCHITECTURE.md Data Model — user table (firstName/lastName)
### Edit 3: ARCHITECTURE.md Data Model — Production (description, banner, systemFieldConfig shape)
### Edit 4: ARCHITECTURE.md Data Model — Role (referencePhotos)
### Edit 5: ARCHITECTURE.md Data Model — Submission (remove snapshot fields, add new fields, fix answers type, remove denormalization note)
### Edit 6: ARCHITECTURE.md Data Model — File (CUSTOM_FIELD type, formFieldId column)
### Edit 7: ARCHITECTURE.md Key Files — types.ts entry update
### Edit 8: features/README.md — add 3 missing route rows + 3 feature rows
