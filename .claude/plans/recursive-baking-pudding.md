# Plan: Multi-Role Submission

## Context

Currently, performers submit to one role at a time via `/s/[orgSlug]/[productionSlug]/[roleSlug]`. In community theatre, performers often audition for multiple roles in the same production. This feature lets them select multiple roles in a single form submission, creating one submission record per selected role — reducing friction and duplicate data entry.

## Approach

Keep the existing per-role URL as the entry point (pre-selects that role), but add a role picker at the top of the form showing all open roles for the production. On submit, create one `Submission` row per selected role in a single transaction. Files are uploaded once and File records are duplicated per submission (same R2 objects).

## Changes

### 1. Schema — `src/lib/schemas/submission.ts`

- Add `createMultiRoleSubmissionSchema` extending `submissionFormSchema`:
  - Replace `roleId: z.string()` with `roleIds: z.array(z.string().min(1)).min(1, "Select at least one role.")`
  - Keep orgId, productionId, headshots, resume as-is

### 2. Server Action — `src/actions/submissions/create-submission.ts`

- Update `createSubmission` to use the new schema with `roleIds` array
- Validate **all** roles exist, are open, and belong to the production
- In the transaction: upsert candidate once, then insert one `Submission` per roleId
- After transaction: move files once, create `File` records for **each** submission
- Parse resume PDF once, update `resumeText` on all submissions
- Send submission email for each submission (fire-and-forget)

### 3. Route Page — `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`

- Pass `production.roles` (all open roles, already fetched by `getPublicProduction`) to `SubmissionForm` as a new `availableRoles` prop
- Pass `role.id` as `initialRoleId` (replaces `roleId` prop)

### 4. Submission Form — `src/components/submissions/submission-form.tsx`

**Props changes:**
- Remove `roleId: string`
- Add `initialRoleId: string`
- Add `availableRoles: { id: string; name: string; description: string }[]`

**Role picker (new, at the top of the form before name fields):**
- `FieldSet` with `FieldLegend` "Roles" and required marker
- List of checkboxes, one per open role — `Checkbox` + role name + truncated description
- `initialRoleId` pre-checked
- `max-h-[280px] overflow-y-auto` for scrolling when many roles
- Error state if none selected on submit

**Submit button:**
- 1 role selected: "Submit"
- N > 1 roles selected: "Submit for N roles"

**Form submission handler:**
- Pass `roleIds` array (from state) instead of single `roleId` to the action

**Success message:**
- Update to say "Submissions received" when multiple roles, with a count

### 5. Reusable Components

- **Checkbox** (`src/components/common/checkbox.tsx`) — already exists, reuse as-is
- **FieldSet/FieldLegend** (`src/components/common/field.tsx`) — already exists, reuse as-is
- No new components needed

## Files to Modify

1. `src/lib/schemas/submission.ts` — new multi-role schema
2. `src/actions/submissions/create-submission.ts` — loop over roleIds
3. `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` — pass roles to form
4. `src/components/submissions/submission-form.tsx` — role picker + dynamic button

## Verification

1. Visit `/s/[orgSlug]/[productionSlug]/[roleSlug]` — role from URL should be pre-selected
2. Check/uncheck additional roles — button text should update ("Submit" vs "Submit for 3 roles")
3. Submit with 0 roles selected — should show validation error
4. Submit with 1 role — should work exactly as before (single submission created)
5. Submit with multiple roles — should create one submission per role, all with same candidate data, files, and form responses
6. Verify file records exist for each submission
7. Scroll behavior: add 10+ roles to a production, confirm the picker scrolls with max height
8. `bun run build` — no type errors
