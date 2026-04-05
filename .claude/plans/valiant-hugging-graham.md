# Plan: Update Stale Librarian Docs

## Context

A librarian audit on 2026-04-05 found 8 docs with stale/missing information and 8 missing feature inventory entries. Most drift comes from PRs #61–#79 (union status, representation, custom field uploads, submission denormalization removal, firstName/lastName split, kanban table view, bulk email, candidate merge, production branding).

## Approach

Spawn the **librarian agent** with the full audit findings and have it update all 8 stale docs in a single pass. The librarian knows the doc conventions and can read the current schema/code to write accurate updates.

## Docs to Update (priority order)

### High priority — data model is wrong
1. **`docs/ARCHITECTURE.md`** — Fix User table (add firstName/lastName), fix Submission table (remove denormalized fields, add sortOrder/videoUrl/unionStatus/representation), add Production.banner, add Role.referencePhotos, add File.formFieldId + CUSTOM_FIELD type, mention sendBatchEmail
2. **`docs/features/submissions.md`** — Remove denormalized fields from data model, add new columns, add presign-custom-field-upload.ts + reorder-submission.ts + bulk-send-email.ts to key files, update data flow for IMAGE/DOCUMENT custom fields
3. **`docs/features/kanban.md`** — Add table view mode, update role filter (chip row not dropdown), add bulk email action + BulkEmailDialog, add sortOrder + fractional indexing, add consider-for-role-dialog.tsx + submission-table-view.tsx to key files, fix submission column references
4. **`docs/features/candidates.md`** — Add candidate merge feature section (merge-candidate.ts, merge-candidate-dialog.tsx, search-candidates.ts), fix "submissions store contact copies" statement
5. **`docs/features/auth.md`** — Update signUpSchema and SignUpForm: name → firstName + lastName

### Lower priority — missing details
6. **`docs/features/productions.md`** — Add banner column to Production, referencePhotos to Role, update list page description (ProductionsTable not card grid)
7. **`docs/features/submission-editing.md`** — Remove references to denormalized submission fields, clarify contact updates go through Candidate
8. **`docs/features/email.md`** — Add bulk email section (bulk-send-email.ts, BulkEmailDialog, sendBatchEmail)
9. **`docs/features/custom-fields.md`** — Add presign-custom-field-upload.ts to key files, mention SYSTEM_FIELD_ALLOWED_VISIBILITIES
10. **`docs/features/organizations.md`** — Add presign-logo-upload.ts to key files

### Feature inventory
11. **`docs/features/README.md`** — Add rows for: submissions table view, candidate merge, bulk send email, consider-for-role, production branding (banner/logo/reference photos), fractional-index sort order

## Execution

- **Agent:** Librarian agent — single invocation with full audit context
- **Verification:** After updates, re-read each modified doc and spot-check against schema at `src/lib/db/schema.ts` and relevant action files

## What this does NOT change
- No code changes — docs only
- No new files — updating existing docs
