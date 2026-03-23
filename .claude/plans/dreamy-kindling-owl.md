# Plan: Lift Role Settings to Production Level

## Context

Currently, productions and roles duplicate the same configuration fields: `location`, `submissionFormFields`, `systemFieldConfig`, `feedbackFormFields`, `rejectReasons`, and pipeline stages. When a role is created, production settings are copied to it and each role can diverge independently. This creates a confusing UX — users have to configure settings in two places and the relationship between "defaults" and "overrides" is unclear.

**Goal:** All configuration lives on the production. Roles become lightweight entities (id, name, slug, description, isOpen, timestamps). Pipeline stages belong to the production, not individual roles. Users configure once at the production level and every role uses those settings.

## Subagents

- **Explore agents** (Phase 1): Used for initial codebase exploration
- **Plan agent** (Phase 2): Used for implementation design
- **Code Reviewer agent**: After implementation, review the changes
- **Librarian agent**: After implementation, update docs

---

## Step 1: Schema Changes

**File:** `src/lib/db/schema.ts`

### Role table (lines 294-328)
Remove these columns:
- `location`
- `submissionFormFields`
- `systemFieldConfig`
- `feedbackFormFields`
- `rejectReasons`

Role keeps: `id`, `productionId`, `name`, `slug`, `description`, `isOpen`, `createdAt`, `updatedAt`.

### PipelineStage table (lines 337-356)
Remove the `roleId` column entirely.

### Relations (lines 565-638)
- **roleRelations** (line 565): Remove `pipelineStages: many(PipelineStage)` — roles no longer own stages
- **pipelineStageRelations** (line 618): Remove the `role: one(Role, ...)` relation

Keep `PipelineUpdate.roleId` and its role relation — it tracks which role a stage transition belongs to.

---

## Step 2: Pipeline Helpers

**File:** `src/lib/pipeline.ts`

- **Delete** `buildSystemStages()` — only used for role-specific stage creation
- **Delete** `buildStagesFromTemplate()` — only used to copy production stages to roles
- **Update** `buildProductionStages()` — remove `roleId: null` from return objects
- **Update** `buildCustomProductionStages()` — remove `roleId: null` from return objects

---

## Step 3: Delete Role-Level Zod Schemas

**File:** `src/lib/schemas/form-fields.ts`

Remove all role-specific schemas:
- `addRoleFormFieldSchema`, `updateRoleFormFieldSchema`, `removeRoleFormFieldSchema`, `reorderRoleFormFieldsSchema`
- `updateRoleSystemFieldConfigSchema`
- `addRoleFeedbackFormFieldSchema`, `updateRoleFeedbackFormFieldSchema`, `removeRoleFeedbackFormFieldSchema`, `reorderRoleFeedbackFormFieldsSchema`

Keep all production-level schemas.

---

## Step 4: Delete Role-Level Server Actions (13 files)

Delete these files entirely:

**Submission form (4):**
- `src/actions/productions/add-role-form-field.ts`
- `src/actions/productions/update-role-form-field.ts`
- `src/actions/productions/remove-role-form-field.ts`
- `src/actions/productions/reorder-role-form-fields.ts`

**System field config (1):**
- `src/actions/productions/update-role-system-field-config.ts`

**Feedback form (4):**
- `src/actions/productions/add-role-feedback-form-field.ts`
- `src/actions/productions/update-role-feedback-form-field.ts`
- `src/actions/productions/remove-role-feedback-form-field.ts`
- `src/actions/productions/reorder-role-feedback-form-fields.ts`

**Reject reasons (1):**
- `src/actions/productions/update-role-reject-reasons.ts`

**Pipeline (3):**
- `src/actions/productions/add-pipeline-stage.ts`
- `src/actions/productions/reorder-role-stages.ts`
- `src/actions/productions/remove-pipeline-stage.ts`

---

## Step 5: Update Server Actions That Read Role Settings

### 5a. `src/actions/productions/create-role.ts`
- Stop reading production settings (remove columns: submissionFormFields, systemFieldConfig, feedbackFormFields, rejectReasons)
- Insert role with only: id, productionId, name, slug, description, isOpen
- Remove pipeline stage creation entirely (no more copying template stages to role)
- Remove imports: `PipelineStage`, `buildStagesFromTemplate`, `buildSystemStages`, `isNull`

### 5b. `src/actions/productions/create-production.ts`
- When inserting roles (lines 113-129): remove `submissionFormFields`, `feedbackFormFields`, `rejectReasons` from role values
- Remove per-role stage creation (lines 134-143): delete `buildStagesFromTemplate` call and the `allStages` insert
- Remove `buildStagesFromTemplate` import

### 5c. `src/actions/submissions/create-submission.ts`
- Query: load `production.submissionFormFields` and `production.systemFieldConfig` instead of role's (lines 44-50)
- Line 70-71: find APPLIED stage by `eq(s.productionId, productionId)` instead of `eq(s.roleId, roleId)`
- Line 80: `sfc = role.production.systemFieldConfig` (or however production is loaded)
- Line 98: `formFields = role.production.submissionFormFields`

### 5d. `src/actions/submissions/update-submission-status.ts`
- Line 45: verify target stage belongs to same **production** not role: `eq(s.productionId, submission.productionId)` instead of `eq(s.roleId, submission.roleId)`

### 5e. `src/actions/submissions/bulk-update-submission-status.ts`
- Line 60: same change — `eq(s.productionId, ...)` instead of `eq(s.roleId, roleId)`

### 5f. `src/actions/submissions/copy-submission-to-role.ts`
- Line 70-71: find APPLIED stage by `eq(s.productionId, targetRole.productionId)` instead of `eq(s.roleId, targetRoleId)`

### 5g. `src/actions/feedback/create-feedback.ts`
- Remove role-level feedbackFormFields from query (lines 26-27)
- Load `production.feedbackFormFields` directly (via submission → role → production)
- Lines 59-62: simplify to just `submission.role.production.feedbackFormFields`
- Line 51: verify stageId belongs to same **production**: `eq(s.productionId, ...)` instead of `eq(s.roleId, ...)`

### 5h. `src/actions/productions/get-role-with-submissions.ts`
- Change `pipelineStages` to load from production instead of role (line 34)
- Load production settings: add `submissionFormFields`, `systemFieldConfig`, `rejectReasons` to production columns (line 27-33)
- Lines 141-144: remove fallback logic, use `role.production.feedbackFormFields` directly
- Return production-level settings instead of role-level

### 5i. `src/actions/productions/get-role-stages-with-counts.ts`
- Look up the role's `productionId`
- Query stages by `eq(PipelineStage.productionId, productionId)` instead of `eq(PipelineStage.roleId, roleId)`
- Keep submission count subquery filtered by `eq(Submission.roleId, roleId)` so counts are role-specific

### 5j. `src/actions/candidates/get-candidate.ts`
- Line 26: change `role: { with: { pipelineStages: true } }` to load production's pipeline stages instead
- Lines 63-76: read form fields from production only, remove role-level fallback logic
- Lines 106-115: pipelineStages from `submission.production.pipelineStages` instead of `submission.role.pipelineStages`

### 5k. `src/actions/submissions/get-public-role.ts`
- Add production settings columns to the `with` clause: `submissionFormFields`, `systemFieldConfig`

### 5l. `src/actions/productions/get-role.ts`
- Remove `pipelineStages` from role `with` clause (line 23-25)
- Add production's `pipelineStages` to the production `with` clause

### 5m. `src/actions/productions/get-roles-with-submissions.ts`
- Remove `pipelineStages` from the role `with` clause (line 21-23)
- Since all roles share the same production stages, the caller should load stages separately or via the production relation

### 5n. Production stage actions — remove `isNull(s.roleId)` filters
These actions currently filter for template stages (`roleId IS NULL`). Since `roleId` is being removed from the table, remove these filters:

- `src/actions/productions/get-production-stages.ts` (line 20): remove `isNull(s.roleId)`
- `src/actions/productions/add-production-stage.ts` (lines 33, 51): remove `isNull(s.roleId)` and `roleId: null`
- `src/actions/productions/remove-production-stage.ts` (line 35): remove `isNull(s.roleId)`. Also add submission count check + feedback force-delete logic (port from `remove-pipeline-stage.ts` lines 48-75) since these are now real stages with submissions.
- `src/actions/productions/reorder-production-stages.ts` (line 35): remove `isNull(s.roleId)`

---

## Step 6: Delete Role Settings UI

### 6a. Delete role settings pages (4 files):
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/pipeline/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/submission-form/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/feedback-form/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/(role)/settings/reject-reasons/page.tsx`

### 6b. Delete role-specific editor components (3 files):
- `src/components/productions/role-form-fields-editor.tsx`
- `src/components/productions/role-feedback-form-fields-editor.tsx`
- `src/components/productions/role-stages-editor.tsx`

### 6c. Update `src/components/productions/role-sub-nav.tsx`
Remove Pipeline, Submission form, Feedback form, and Reject reasons nav items. Keep only Submissions and General.

### 6d. Update role submissions page
**File:** `src/app/(app)/productions/[id]/roles/[roleId]/(role)/page.tsx`
Pass production-level settings (from updated `getRoleWithSubmissions`) instead of role-level.

### 6e. Update stage detail page
**File:** `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx`
Same — use production-level settings.

### 6f. Update public submission page
**File:** `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`
Lines 67-68: pass `role.production.submissionFormFields` and `role.production.systemFieldConfig` instead of role-level.

---

## Step 7: Rename "Default" Components

Production settings components currently use "Default" naming because they were templates. They are now the real settings.

### 7a. `src/components/productions/default-stages-editor.tsx`
- Rename `DefaultStagesEditor` export to `ProductionStagesEditor`
- Remove description "Changes here only apply to new roles. Existing roles are not affected." (line 306)
- Update FixedStage tooltip from "Required for all roles" to "System stage" (line 101)

### 7b. `src/components/productions/form-fields-editor.tsx`
- Rename `DefaultFormFieldsEditor` to `ProductionFormFieldsEditor` (if it exists as a wrapper)
- Remove any "Changes here only apply to new roles..." description

### 7c. `src/components/productions/default-feedback-form-fields-editor.tsx`
- Rename to `production-feedback-form-fields-editor.tsx`
- Rename export `DefaultFeedbackFormFieldsEditor` to `ProductionFeedbackFormFieldsEditor`
- Remove "defaults" description

### 7d. Update import sites
- `src/app/(app)/productions/[id]/(production)/settings/pipeline/page.tsx`
- `src/app/(app)/productions/[id]/(production)/settings/submission-form/page.tsx`
- `src/app/(app)/productions/[id]/(production)/settings/feedback-form/page.tsx`

---

## Step 8: Harden Production Stage Deletion

**File:** `src/actions/productions/remove-production-stage.ts`

Currently this action just deletes without checking for submissions (it was a template-only action). Port submission count check and feedback force-delete logic from `remove-pipeline-stage.ts`:

1. Add `force: z.boolean().optional()` to input schema
2. Check `Submission` count on the stage — block if > 0
3. Check `Feedback` count — return `confirmRequired` if > 0 and `!force`
4. Delete feedback first if force-deleting, then delete the stage

---

## Step 9: Migration

**File:** New migration in `src/lib/db/drizzle/`

**Approach:** Since this is an early-stage project with recent migration resets, the simplest path is to reset migrations after making the schema changes. Run `bunx drizzle-kit generate` to create a fresh migration, then apply it.

If there's existing data that needs preserving, the migration must:
1. For each role-specific stage, find matching production-level stage (by `type` for system stages, by `name` for custom stages)
2. Update `submission.stage_id`, `feedback.stage_id`, `pipeline_update.from_stage`, `pipeline_update.to_stage` to point to production-level stages
3. Delete all role-specific stages (`WHERE role_id IS NOT NULL`)
4. `ALTER TABLE pipeline_stage DROP COLUMN role_id`
5. `ALTER TABLE role DROP COLUMN location, submission_form_fields, system_field_config, feedback_form_fields, reject_reasons`

---

## Step 10: Lint & Build Check

Run `bun run lint` and `bun run build` to catch any remaining broken imports or type errors.

---

## Verification

After implementation, the user should verify:

1. **Production settings pages** (`/productions/[id]/settings/*`): Pipeline, submission form, feedback form, and reject reasons editors all work. The "defaults" language is gone.
2. **Role creation**: Creating a new role no longer copies settings or creates pipeline stages.
3. **Role settings**: Only General settings tab exists (name, slug, description, isOpen). No pipeline/form/feedback/reject settings.
4. **Submissions board** (`/productions/[id]/roles/[roleId]`): Displays production-level pipeline stages with per-role submission counts.
5. **Public submission form** (`/s/[org]/[production]/[role]`): Uses production-level submission form and system field config.
6. **Moving submissions between stages**: Works using production-level stages.
7. **Feedback form**: Uses production-level feedback form fields.
8. **Stage deletion at production level**: Blocks if submissions exist, confirms if feedback exists.
