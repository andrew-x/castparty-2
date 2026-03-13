# Submission Form Builder

## Context

The submission form settings pages (production and role level) currently show only a custom fields editor. The user wants a form builder experience with:
1. A split layout: editor on the left, live preview on the right
2. System field visibility toggles (phone, location, headshots, resume, links) with three states: hidden / optional / required
3. Both production-level and role-level pages updated

Currently, system fields (phone, location, headshots, resume, links) are hardcoded as always-visible optional fields in the candidate-facing `SubmissionForm`. There is no way to configure their visibility.

---

## Step 1: Data Model

### Types (`src/lib/types.ts`)
Add:
```ts
export type SystemFieldVisibility = "hidden" | "optional" | "required"
export type SystemFieldConfig = {
  phone: SystemFieldVisibility
  location: SystemFieldVisibility
  headshots: SystemFieldVisibility
  resume: SystemFieldVisibility
  links: SystemFieldVisibility
}
export const DEFAULT_SYSTEM_FIELD_CONFIG: SystemFieldConfig = {
  phone: "optional",
  location: "optional",
  headshots: "optional",
  resume: "optional",
  links: "optional",
}
export const SYSTEM_FIELD_LABELS: Record<keyof SystemFieldConfig, string> = {
  phone: "Phone number",
  location: "Location",
  headshots: "Headshots",
  resume: "Resume",
  links: "Links",
}
```

### DB Schema (`src/lib/db/schema.ts`)
Add `systemFieldConfig` JSONB column to both `Production` and `Role` tables, right after `submissionFormFields`:
```ts
systemFieldConfig: jsonb().$type<SystemFieldConfig>().notNull().default({
  phone: "optional", location: "optional", headshots: "optional",
  resume: "optional", links: "optional",
}),
```

### Migration
Run `bun drizzle-kit generate` then `bun drizzle-kit migrate` to add the column. The migration must include an `UPDATE` to set existing rows to the default value since Drizzle's `.default()` only applies to new inserts.

---

## Step 2: Schemas + Server Actions

### Zod schemas (`src/lib/schemas/form-fields.ts`)
Add:
```ts
export const systemFieldVisibilitySchema = z.enum(["hidden", "optional", "required"])
export const systemFieldConfigSchema = z.object({
  phone: systemFieldVisibilitySchema,
  location: systemFieldVisibilitySchema,
  headshots: systemFieldVisibilitySchema,
  resume: systemFieldVisibilitySchema,
  links: systemFieldVisibilitySchema,
})
export const updateProductionSystemFieldConfigSchema = z.object({
  productionId: z.string().min(1),
  systemFieldConfig: systemFieldConfigSchema,
})
export const updateRoleSystemFieldConfigSchema = z.object({
  roleId: z.string().min(1),
  systemFieldConfig: systemFieldConfigSchema,
})
```

### New action: `src/actions/productions/update-production-system-field-config.ts`
- `secureActionClient` with `updateProductionSystemFieldConfigSchema`
- Verify production belongs to user's org
- `db.update(Production).set({ systemFieldConfig })`
- `revalidatePath("/", "layout")`

### New action: `src/actions/productions/update-role-system-field-config.ts`
- Same pattern for roles

### Update `src/actions/productions/create-role.ts`
- Fetch `systemFieldConfig` from the production (add to columns)
- Copy it to the new role, same as `submissionFormFields` is copied today (line ~56)

---

## Step 3: SystemFieldToggles Component

### New file: `src/components/productions/system-field-toggles.tsx`

A `"use client"` component. Props:
- `config: SystemFieldConfig`
- `onChange: (config: SystemFieldConfig) => void`

Renders a bordered section titled "Standard fields" with a note: "First name, last name, and email are always required."

For each of the 5 configurable fields, render a row with:
- Field name label
- A `ToggleGroup` (from `@/components/common/toggle-group`) with `type="single"` and 3 items:
  - "Hidden" (value `"hidden"`)
  - "Optional" (value `"optional"`)
  - "Required" (value `"required"`)

Use `variant="outline"` and `size="sm"` on the ToggleGroup for a compact segmented-control look.

---

## Step 4: Shared Field Rendering — `CustomFieldDisplay`

### New file: `src/components/submissions/custom-field-display.tsx`

Extract the custom field rendering switch (~185 lines) from `SubmissionForm` into a reusable presentational component. Both the live form and preview will use it.

Props:
```ts
interface Props {
  field: CustomForm
  value: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: { message?: string }
  id?: string
}
```

Renders the appropriate input based on `field.type`:
- `TEXT` → `Field > FieldLabel > Input`
- `TEXTAREA` → `Field > FieldLabel > Textarea`
- `SELECT` → `Field > FieldLabel > Select`
- `CHECKBOX_GROUP` → `FieldSet > FieldLegend > Checkbox list`
- `TOGGLE` → `Field (horizontal) > FieldLabel > Switch`

Includes `FieldDescription` when `field.description` is set. Shows required marker when `field.required`. Shows `FieldError` when `error` is provided.

**Usage in live form (`SubmissionForm`):** Wrap in `Controller`, pass `field.value`/`field.onChange`/`fieldState.error`.
**Usage in preview:** Pass `value=""`, `disabled`, no `onChange`/`error`.

This eliminates the duplicated switch and ensures the preview always matches the real form visually.

### Helper: `systemFieldLabel(name, visibility)`

Add a small helper function (in `src/lib/types.ts` or inline) that returns the field label with "(optional)" suffix when visibility is `"optional"`, or a required marker indicator when `"required"`. Reusable in both the live form and preview for consistent labeling.

---

## Step 5: SubmissionFormPreview Component

### New file: `src/components/productions/submission-form-preview.tsx`

A `"use client"` component. Props:
- `systemFieldConfig: SystemFieldConfig`
- `customFields: CustomForm[]`

Renders a read-only, non-interactive preview of the candidate-facing form in a bordered card with a "Preview" header.

- Always shows: first name, last name, email (required markers)
- Conditionally shows phone, location, headshots, resume, links based on `systemFieldConfig` (hidden → skip, optional → "(optional)" label, required → required marker)
- Renders custom fields using `CustomFieldDisplay` with `disabled` — no duplicated switch
- Includes a disabled "Submit audition" button at the bottom

---

## Step 6: FormBuilder Layout Component (was Step 5)

### New file: `src/components/productions/form-builder.tsx`

A `"use client"` component that composes the editor and preview in a split layout. Props:
- `systemFieldConfig: SystemFieldConfig`
- `customFields: CustomForm[]`
- `onSystemFieldConfigChange: (config: SystemFieldConfig) => void`
- All `FormFieldsEditor` callback props (onAdd, onSave, onRemove, onReorder, isAdding, isSaving, removingFieldId)
- `description?: string`

Layout:
```tsx
<div className="grid grid-cols-1 gap-section lg:grid-cols-[1fr_380px]">
  {/* Left: Editor */}
  <div className="flex flex-col gap-group">
    <SystemFieldToggles config={...} onChange={...} />
    <div>
      <h3 className="font-serif text-heading mb-group">Custom fields</h3>
      <FormFieldsEditor fields={...} ... />
    </div>
  </div>
  {/* Right: Preview (sticky, desktop only) */}
  <div className="hidden lg:block">
    <div className="sticky top-4">
      <SubmissionFormPreview systemFieldConfig={...} customFields={...} />
    </div>
  </div>
</div>
```

---

## Step 7: Wire Up Production-Level Page

### Update `DefaultFormFieldsEditor` (`src/components/productions/form-fields-editor.tsx`)
- Add `systemFieldConfig: SystemFieldConfig` prop
- Add local state for system field config (optimistic like `localFields`)
- Wire `useAction(updateProductionSystemFieldConfig)` for persisting changes
- Render `FormBuilder` instead of `FormFieldsEditor` directly

### Update production settings page (`src/app/(app)/productions/[id]/(production)/settings/submission-form/page.tsx`)
- Pass `systemFieldConfig={production.systemFieldConfig}` to `DefaultFormFieldsEditor`
- Remove `max-w-page-content` from wrapper (the split layout needs more room)

---

## Step 8: Wire Up Role-Level Page

### Update `RoleFormFieldsEditor` (`src/components/productions/role-form-fields-editor.tsx`)
- Same changes as `DefaultFormFieldsEditor` but with role actions

### Update role settings page (`src/app/(app)/productions/[id]/roles/[roleId]/settings/submission-form/page.tsx`)
- Pass `systemFieldConfig={role.systemFieldConfig}`
- Remove `max-w-page-content`

---

## Step 9: Update Candidate-Facing Form

### Update `SubmissionForm` (`src/components/submissions/submission-form.tsx`)
- Add `systemFieldConfig: SystemFieldConfig` prop (default to `DEFAULT_SYSTEM_FIELD_CONFIG`)
- Conditionally render phone, location, headshots, resume, links based on visibility:
  - `"hidden"` → skip entirely
  - `"optional"` → show with "(optional)" label
  - `"required"` → show with required marker, add client-side validation
- Replace the custom field switch statement with `CustomFieldDisplay` wrapped in `Controller`
- Update `defaultValues` to only include non-hidden fields

### Update `create-submission.ts` (`src/actions/submissions/create-submission.ts`)
- Fetch `systemFieldConfig` from role (add to query columns)
- Add dynamic validation for required system fields (phone, location, headshots, resume, links)
- Skip storing hidden fields (set to empty/null regardless of input)

### Update public role page (`src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`)
- Pass `systemFieldConfig={role.systemFieldConfig}` to `SubmissionForm`

---

## Files Summary

**New files (6):**
- `src/actions/productions/update-production-system-field-config.ts`
- `src/actions/productions/update-role-system-field-config.ts`
- `src/components/productions/system-field-toggles.tsx`
- `src/components/submissions/custom-field-display.tsx` (shared between preview + live form)
- `src/components/productions/submission-form-preview.tsx`
- `src/components/productions/form-builder.tsx`

**Modified files (~12):**
- `src/lib/types.ts`
- `src/lib/db/schema.ts`
- `src/lib/schemas/form-fields.ts`
- `src/actions/productions/create-role.ts`
- `src/components/productions/form-fields-editor.tsx` (DefaultFormFieldsEditor)
- `src/components/productions/role-form-fields-editor.tsx`
- `src/components/submissions/submission-form.tsx`
- `src/actions/submissions/create-submission.ts`
- `src/app/(app)/productions/[id]/(production)/settings/submission-form/page.tsx`
- `src/app/(app)/productions/[id]/roles/[roleId]/settings/submission-form/page.tsx`
- `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`

---

## Verification

1. **Build check:** `bun run build` should pass with no errors
2. **Lint check:** `bun run lint` should pass
3. **Production settings page:** Navigate to a production's Submission Form settings. Verify:
   - Split layout: editor on left, preview on right
   - System field toggles visible with all 5 fields defaulting to "Optional"
   - Changing a toggle updates the preview in real-time
   - Setting a field to "Hidden" removes it from preview
   - Setting to "Required" adds a required marker in preview
   - Custom fields still work (add, edit, reorder, remove)
4. **Role settings page:** Same checks as above
5. **Candidate-facing form:** Submit to a role and verify:
   - Hidden fields don't appear
   - Optional fields appear without required markers
   - Required fields show required markers and validate
   - Submission still works end-to-end
6. **New role creation:** Create a new role and verify it inherits both `submissionFormFields` and `systemFieldConfig` from the production
