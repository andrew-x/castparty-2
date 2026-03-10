# Plan: Feedback Form Fields on Productions & Roles

## Context

Productions and roles already have configurable **submission form fields** (custom questions candidates answer when applying). The production team now needs a parallel set of **feedback form fields** — custom fields they'll fill out when evaluating candidates after auditions/callbacks. This task adds the field configuration only; the actual feedback entry UI comes later.

Additionally, the current "Application form" section heading is renamed to "Submission form" for clarity.

## Approach

Mirror the existing submission form field pattern exactly: new JSONB column, same `CustomForm[]` type, same `FormFieldsEditor` component, parallel actions and schemas.

**Field ID prefix:** `"fbf"` (vs `"ff"` for submission fields) for debuggability.

## Steps

### 1. Database schema — `src/lib/db/schema.ts`

Add `feedbackFormFields: jsonb().$type<CustomForm[]>().notNull().default([])` to both `Production` and `Role` table definitions (alongside existing `formFields`).

Run `bun run db:generate` then `bun run db:migrate` to apply.

### 2. Zod schemas — `src/lib/schemas/form-fields.ts`

Add 8 new schemas at the end, mirroring the existing 8 with `Feedback` in the name:

| New schema | Mirrors |
|---|---|
| `addProductionFeedbackFormFieldSchema` | `addProductionFormFieldSchema` |
| `updateProductionFeedbackFormFieldSchema` | `updateProductionFormFieldSchema` |
| `removeProductionFeedbackFormFieldSchema` | `removeProductionFormFieldSchema` |
| `reorderProductionFeedbackFormFieldsSchema` | `reorderProductionFormFieldsSchema` |
| `addRoleFeedbackFormFieldSchema` | `addRoleFormFieldSchema` |
| `updateRoleFeedbackFormFieldSchema` | `updateRoleFormFieldSchema` |
| `removeRoleFeedbackFormFieldSchema` | `removeRoleFormFieldSchema` |
| `reorderRoleFeedbackFormFieldsSchema` | `reorderRoleFormFieldsSchema` |

Structurally identical — same fields, just different export names.

### 3. Server actions — 8 new files in `src/actions/productions/`

Each mirrors its submission counterpart, with these differences:
- Reads/writes `feedbackFormFields` column instead of `formFields`
- Uses `generateId("fbf")` instead of `generateId("ff")`
- Imports feedback schema variant
- Metadata string uses `feedback-form-field` naming

| New file | Mirrors |
|---|---|
| `add-production-feedback-form-field.ts` | `add-production-form-field.ts` |
| `update-production-feedback-form-field.ts` | `update-production-form-field.ts` |
| `remove-production-feedback-form-field.ts` | `remove-production-form-field.ts` |
| `reorder-production-feedback-form-fields.ts` | `reorder-production-form-fields.ts` |
| `add-role-feedback-form-field.ts` | `add-role-form-field.ts` |
| `update-role-feedback-form-field.ts` | `update-role-form-field.ts` |
| `remove-role-feedback-form-field.ts` | `remove-role-form-field.ts` |
| `reorder-role-feedback-form-fields.ts` | `reorder-role-form-fields.ts` |

### 4. Wrapper components — 2 new files

**`src/components/productions/default-feedback-form-fields-editor.tsx`**
Mirrors `DefaultFormFieldsEditor` (in `form-fields-editor.tsx` lines 419-513). Imports the 4 production feedback actions. Description: "These are the default feedback form fields for new roles. Updating them will not change feedback forms on roles that have already been created."

**`src/components/productions/role-feedback-form-fields-editor.tsx`**
Mirrors `RoleFormFieldsEditor` (in `role-form-fields-editor.tsx`). Imports the 4 role feedback actions.

Both reuse the existing `FormFieldsEditor` component — no changes to it.

### 5. Settings pages — rename + add new section

**`src/app/(app)/productions/[id]/(production)/settings/page.tsx`**
- Change heading `"Application form"` → `"Submission form"`
- Add `<Separator />` then new "Feedback form" section with `DefaultFeedbackFormFieldsEditor`
- Pass `production.feedbackFormFields` as `fields` prop

**`src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`**
- Change heading `"Application form"` → `"Submission form"`
- Add `<Separator />` then new "Feedback form" section with `RoleFeedbackFormFieldsEditor`
- Pass `role.feedbackFormFields` as `fields` prop

### 6. Role creation — copy defaults — `src/actions/productions/create-role.ts`

**Critical:** When a new role is created, it copies `formFields` from the production. Must also copy `feedbackFormFields`:
- Line 33: Add `feedbackFormFields: true` to columns selection
- Line 45-55: Add `feedbackFormFields` to insert values, mapping with `generateId("fbf")`

### No changes needed

- `src/lib/types.ts` — reuses `CustomForm[]` as-is
- `src/components/productions/form-fields-editor.tsx` — already generic
- Read functions (`get-production.ts`, `get-role.ts`) — no column filter, new column included automatically

## Subagents

- **dispatching-parallel-agents** for steps 2-4 (schemas, actions, components are independent once schema is done)
- **code-reviewer** after implementation

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — passes
3. Visit production settings → see "Submission form" and "Feedback form" sections
4. Add/edit/remove/reorder feedback fields on a production
5. Visit role settings → see both sections
6. Add/edit/remove/reorder feedback fields on a role
7. Create a new role → verify it inherits both submission and feedback form fields from production defaults
