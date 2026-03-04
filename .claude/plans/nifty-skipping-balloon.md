# Unify "Accepting submissions" toggle and save button across settings forms

## Context

The production and role settings forms handle the "accepting submissions" toggle differently:
- **Production**: Toggle is outside the form, saves immediately via a separate `toggleProductionOpen` action
- **Role**: Toggle is inside the form, saved with the rest of the fields

The user wants both to save alongside the form (not on toggle), look the same, and have a centered primary-color save button.

## Changes

### 1. Production settings form — move toggle into the form
**File:** `src/components/productions/production-settings-form.tsx`

- Add `isOpen: z.boolean()` to the form schema
- Add `isOpen` as a `defaultValue` from the `isOpen` prop
- Replace the standalone `<Field orientation="horizontal">` + `Switch` + `toggleProductionOpen` with a `Controller`-managed field inside the `<form>`, matching the role form's layout:
  ```tsx
  <Controller
    name="isOpen"
    control={form.control}
    render={({ field }) => (
      <Field orientation="horizontal">
        <FieldContent>
          <FieldTitle>Accepting submissions</FieldTitle>
          <FieldDescription>
            When on, candidates can find and submit to this production.
            When off, all audition pages for this production are hidden.
          </FieldDescription>
        </FieldContent>
        <Switch
          id={field.name}
          checked={field.value}
          onCheckedChange={field.onChange}
        />
      </Field>
    )}
  />
  ```
- Include `isOpen` in the `hasChanges` check
- Remove the `toggleProductionOpen` import, `useAction` call, `handleToggle`, and `useState(isOpen)` — replace local `open` state with `watched.isOpen`
- Update the audition page section to use `watched.isOpen` instead of the local `open` state

### 2. Role settings form — match toggle layout to production
**File:** `src/components/productions/role-settings-form.tsx`

- Change the `isOpen` Controller render from the compact `Switch` + `FieldLabel` layout to use `Field orientation="horizontal"` with `FieldContent` > `FieldTitle` + `FieldDescription`, matching the production form:
  ```tsx
  <Field orientation="horizontal">
    <FieldContent>
      <FieldTitle>Accepting submissions</FieldTitle>
      <FieldDescription>
        When on, candidates can find and submit to this role.
        When off, the audition page for this role is hidden.
      </FieldDescription>
    </FieldContent>
    <Switch ... />
  </Field>
  ```
- Add missing imports: `FieldContent`, `FieldTitle`, `FieldDescription`

### 3. Save button — both forms
**Files:** Both form files above

Change the save button from:
```tsx
<Button type="submit" variant="outline" size="sm" ...>Save</Button>
```
To centered, primary variant:
```tsx
<div className="flex justify-center">
  <Button type="submit" loading={...} disabled={!hasChanges}>
    Save
  </Button>
</div>
```
(`variant="default"` is the primary color, which is the implicit default)

### 4. `updateProduction` action — accept `isOpen`
**File:** `src/actions/productions/update-production.ts`

- Add `isOpen: z.boolean().optional()` to the input schema
- Include `isOpen` in the `.set()` call when provided
- This lets the production form save `isOpen` alongside name and slug

### 5. No changes needed
- `toggleProductionOpen` action: Leave the file in place (not referenced anymore from the form, but removing dead code is out of scope)
- `updateRole` action: Already accepts `isOpen` — no changes needed
- `updateRoleSlug` action: No changes needed

## Files to modify
1. `src/components/productions/production-settings-form.tsx`
2. `src/components/productions/role-settings-form.tsx`
3. `src/actions/productions/update-production.ts`

## Verification
- Visit a production settings page → toggle should be inside the form, Save button centered and primary-colored, toggle change only persists on Save
- Visit a role settings page → same toggle layout and Save button style
- Both forms should show the toggle with title + description on the left, switch on the right
