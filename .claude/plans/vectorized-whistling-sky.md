# Customizable Forms — Implementation Plan

## Context

Production teams need to define custom form fields (beyond the hardcoded name/email/phone) at both production and role levels. This plan covers the form builder and the production→role inheritance. Submission-side rendering and answer storage are deferred to a follow-up.

**Inheritance model:** Copy on creation (same as pipeline stages). When a role is created, the production's `formFields` are copied into the role with fresh IDs. Each then diverges independently.

**Field config:** Label, description, required toggle, and options list (for select/multiselect). Field type is immutable after creation.

**Builder UX:** Inline editing with drag-and-drop reordering, matching the pipeline stages editor pattern.

**Existing infrastructure:** `CustomForm`/`CustomFormResponse` types in `src/lib/types.ts`, `formFields` JSONB columns on Production and Role, `answers` JSONB column on Submission — all exist but are currently unused.

---

## Phase 1: Type & Schema Foundation

### 1A. Add `required` to CustomForm type

**Modify:** `src/lib/types.ts`
- Add `required: boolean` to the `CustomForm` type

### 1B. Create form-fields schemas

**Create:** `src/lib/schemas/form-fields.ts`
- Zod schemas for production and role form field actions (add, update, remove, reorder)
- Shared `customFormFieldTypeSchema` enum
- Select/multiselect validated to have at least one option on update

---

## Phase 2: Server Actions (Form Field CRUD)

All actions use the read-modify-write pattern on the `formFields` JSONB column. Each verifies org ownership via `secureActionClient`.

### 2A. Production-level actions (4 new files in `src/actions/productions/`)

| File | Action |
|------|--------|
| `add-production-form-field.ts` | Append new field with `generateId("ff")`, given type/label, defaults for rest |
| `update-production-form-field.ts` | Find field by ID, merge partial updates |
| `remove-production-form-field.ts` | Filter out field by ID |
| `reorder-production-form-fields.ts` | Reorder array to match `fieldIds` order |

### 2B. Role-level actions (4 new files in `src/actions/productions/`)

| File | Action |
|------|--------|
| `add-role-form-field.ts` | Same as production but on `Role.formFields` |
| `update-role-form-field.ts` | Same pattern |
| `remove-role-form-field.ts` | Same pattern |
| `reorder-role-form-fields.ts` | Same pattern |

Role actions validate via `role.production.organizationId` against user's `activeOrganizationId`.

---

## Phase 3: Form Builder Component

**Reference pattern:** `StagesEditor` / `DefaultStagesEditor` in `src/components/productions/default-stages-editor.tsx`

### 3A. Core editor + production wrapper

**Create:** `src/components/productions/form-fields-editor.tsx`

**`FormFieldsEditor` (controlled component):**
- Props: `fields`, `onAdd`, `onUpdate`, `onRemove`, `onReorder`, `isAdding?`, `removingFieldId?`, `description?`
- Bordered card layout matching StagesEditor visual style
- `@dnd-kit/react` drag-and-drop reordering (same library as stages)
- Each field row: drag handle (`GripVerticalIcon`), type badge (read-only), inline-editable label, required toggle (`Switch`), expand chevron for description + options, remove button (`XIcon`)
- Add section at bottom: type selector (`Select` component) + label input + Add button
- Expanded options editor for SELECT/MULTISELECT: list of text inputs with add/remove buttons

**`DefaultFormFieldsEditor` (production wrapper):**
- Props: `productionId`, `fields`
- Optimistic local state via `useState`, wires `useAction` for each production action
- `router.refresh()` on success/error (same as `DefaultStagesEditor`)
- Description: "These are the default form fields for new roles. Updating them will not change forms on roles that have already been created."

### 3B. Role wrapper

**Create:** `src/components/productions/role-form-fields-editor.tsx`

**`RoleFormFieldsEditor`:**
- Props: `roleId`, `fields`
- Same optimistic pattern, wires role-level actions

---

## Phase 4: Wire Builder into Settings Pages

### 4A. Production settings

**Modify:** `src/app/(app)/productions/[id]/(production)/settings/page.tsx`
- Import `DefaultFormFieldsEditor`
- Add section after Pipeline Stages: `<Separator />` + heading "Application form" + `<DefaultFormFieldsEditor>`
- `production.formFields` already returned by `getProduction` (no column restriction)

### 4B. Role settings

**Modify:** `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`
- Import `RoleFormFieldsEditor`
- Add section after Pipeline stages: same pattern
- `role.formFields` already returned by `getRole` (no column restriction)

---

## Phase 5: Copy formFields on Role Creation

**Modify:** `src/actions/productions/create-role.ts`
- Expand production query columns to include `formFields`
- Copy to new role with fresh IDs: `formFields: production.formFields.map(f => ({ ...f, id: generateId("ff") }))`

---

## File Summary

**New files (10):**
- `src/lib/schemas/form-fields.ts`
- `src/actions/productions/add-production-form-field.ts`
- `src/actions/productions/update-production-form-field.ts`
- `src/actions/productions/remove-production-form-field.ts`
- `src/actions/productions/reorder-production-form-fields.ts`
- `src/actions/productions/add-role-form-field.ts`
- `src/actions/productions/update-role-form-field.ts`
- `src/actions/productions/remove-role-form-field.ts`
- `src/actions/productions/reorder-role-form-fields.ts`
- `src/components/productions/form-fields-editor.tsx`
- `src/components/productions/role-form-fields-editor.tsx`

**Modified files (4):**
- `src/lib/types.ts`
- `src/actions/productions/create-role.ts`
- `src/app/(app)/productions/[id]/(production)/settings/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/settings/page.tsx`

## Subagent Strategy

Use **subagent-driven-development** to parallelize:
- **Agent A:** Phase 1 (types + schemas) — all other work depends on this
- **Agent B:** Phase 2 (all 8 server actions) — after Phase 1
- **Agent C:** Phase 3 (builder components) — after Phase 2
- **Agent D:** Phase 4 (settings pages) + Phase 5 (copy on create) — after Phase 3

Or more aggressively, Phase 2 and Phase 5 can run in parallel since they touch different files.

## Reusable Patterns & Utilities

- `StagesEditor` pattern (`src/components/productions/default-stages-editor.tsx`) — controlled component + wrapper with `useAction` + optimistic state
- `generateId` (`src/lib/util.ts`) — ID generation with prefix
- `secureActionClient` (`src/lib/action.ts`) — authenticated action client
- `@dnd-kit/react` + `@dnd-kit/helpers` — already installed, same imports as stages editor
- `Switch` component (`src/components/common/switch`) — for required toggle
- `Select` component (`src/components/common/select`) — for field type selector

## Verification

1. `bun run build` — no type errors
2. `bun run lint` — no lint errors
3. Visit `/productions/[id]/settings` — form builder section appears, can add/edit/reorder/remove fields of all 5 types
4. Create a new role — verify it inherits the production's form fields
5. Visit `/productions/[id]/roles/[roleId]/settings` — role-level form builder shows inherited fields, editable independently
6. Edit production form after role exists — verify role's form is unaffected
