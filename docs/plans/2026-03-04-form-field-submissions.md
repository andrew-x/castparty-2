# Form Field Submissions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable submission-side rendering of custom form fields, store answers, and display them in the admin detail sheet.

**Architecture:** Flat `Record<string, string>` in the form (keyed by field ID), transformed to `CustomFormResponse[]` at submit time. Server-side validation for required fields against the role's `formFields`. Admin side joins `answers[]` with `formFields[]` to render labeled responses.

**Tech Stack:** React Hook Form (Controller), next-safe-action (publicActionClient), Zod v4, Radix Switch/Checkbox/Select, Drizzle relational queries.

---

### Task 1: Rename CHECKBOX → TOGGLE and MULTISELECT → CHECKBOX_GROUP

Rename the two type values across all type definitions, Zod schemas, and editor components. This is a find-and-replace across 4 files with no logic changes.

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/lib/schemas/form-fields.ts`
- Modify: `src/components/productions/form-fields-editor.tsx`

**Step 1: Update `src/lib/types.ts`**

Replace the type union and update the options comment:

```ts
export type CustomFormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "SELECT"
  | "CHECKBOX_GROUP"
  | "TOGGLE"
```

Update the `CustomForm` options comment:

```ts
options: string[] // For SELECT and CHECKBOX_GROUP types
```

**Step 2: Update `src/lib/schemas/form-fields.ts`**

Replace the Zod enum values:

```ts
export const customFormFieldTypeSchema = z.enum([
  "TEXT",
  "TEXTAREA",
  "SELECT",
  "CHECKBOX_GROUP",
  "TOGGLE",
])
```

**Step 3: Update `src/components/productions/form-fields-editor.tsx`**

Replace the `FIELD_TYPE_LABELS` map:

```ts
const FIELD_TYPE_LABELS: Record<CustomFormFieldType, string> = {
  TEXT: "Text",
  TEXTAREA: "Long text",
  SELECT: "Select",
  CHECKBOX_GROUP: "Checkbox group",
  TOGGLE: "Toggle",
}
```

Replace the options editor condition (line 265):

```tsx
{(field.type === "SELECT" || field.type === "CHECKBOX_GROUP") && (
```

**Step 4: Verify build**

Run: `bun run build`
Expected: No type errors. All references to old values caught by TypeScript.

**Step 5: Commit**

```
feat: rename CHECKBOX to TOGGLE and MULTISELECT to CHECKBOX_GROUP
```

---

### Task 2: Extend submission schemas with answers

Add an `answers` field to both the form and action schemas. The form schema uses a flat record (field ID → string value). The action schema extends it identically.

**Files:**
- Modify: `src/lib/schemas/submission.ts`

**Step 1: Add answers to both schemas**

```ts
import { z } from "zod/v4"

export const submissionFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
  answers: z.record(z.string(), z.string()).default({}),
})

export const submissionActionSchema = submissionFormSchema.extend({
  orgId: z.string().min(1),
  productionId: z.string().min(1),
  roleId: z.string().min(1),
})
```

The `answers` field is a `z.record()` keyed by field ID with string values. No static required validation — that happens server-side in the action handler.

**Step 2: Verify build**

Run: `bun run build`
Expected: No type errors. The form schema now includes `answers`.

**Step 3: Commit**

```
feat: add answers field to submission schemas
```

---

### Task 3: Render dynamic form fields in SubmissionForm

Accept `formFields: CustomForm[]` as a prop and render each field after the hardcoded contact fields. Transform the flat answers record into `CustomFormResponse[]` before submitting.

**Files:**
- Modify: `src/components/submissions/submission-form.tsx`

**Step 1: Add imports and update Props**

Add to the existing imports:

```tsx
import { Checkbox } from "@/components/common/checkbox"
import { FieldDescription } from "@/components/common/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { Switch } from "@/components/common/switch"
import { Textarea } from "@/components/common/textarea"
import type { CustomForm, CustomFormResponse } from "@/lib/types"
```

Update `FieldDescription` import — it's already imported from field, but only `Field`, `FieldError`, `FieldGroup`, `FieldLabel` are currently imported. Add `FieldDescription` and `FieldSet` and `FieldLegend` to the destructured import from `@/components/common/field`.

Update the Props interface:

```tsx
interface Props {
  orgId: string
  productionId: string
  roleId: string
  orgSlug: string
  productionSlug: string
  formFields: CustomForm[]
}
```

**Step 2: Add defaultValues for answers and transform function**

Inside the component, before `useHookFormAction`, build default values for the answers record:

```tsx
const defaultAnswers: Record<string, string> = {}
for (const field of formFields) {
  defaultAnswers[field.id] = field.type === "TOGGLE" ? "false" : ""
}
```

Update `useHookFormAction` defaultValues:

```tsx
formProps: {
  defaultValues: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    answers: defaultAnswers,
  },
},
```

Add a transform function before the return statement:

```tsx
function toFormResponses(
  answers: Record<string, string>,
): CustomFormResponse[] {
  return formFields.map((field) => {
    const value = answers[field.id] ?? ""
    switch (field.type) {
      case "TEXT":
      case "TEXTAREA":
        return {
          fieldId: field.id,
          textValue: value,
          booleanValue: null,
          optionValues: null,
        }
      case "SELECT":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: null,
          optionValues: value ? [value] : [],
        }
      case "CHECKBOX_GROUP":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: null,
          optionValues: value ? value.split(",") : [],
        }
      case "TOGGLE":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: value === "true",
          optionValues: null,
        }
    }
  })
}
```

**Step 3: Update the form submit handler**

Change the `handleSubmit` call to transform answers:

```tsx
<form
  onSubmit={form.handleSubmit((v) =>
    action.execute({
      ...v,
      orgId,
      productionId,
      roleId,
      answers: toFormResponses(v.answers),
    }),
  )}
>
```

**Important:** Because `toFormResponses` transforms the flat record into `CustomFormResponse[]`, the action schema needs to accept `CustomFormResponse[]` for the answers field, not a flat record. This means we need to adjust the schema approach: the **form** schema uses `z.record()` for the form state, but the **action** schema should accept `CustomFormResponse[]`. We'll update the action schema in a later step (Task 5) to use `z.array()` instead.

Actually, a cleaner approach: keep both schemas using `z.record()`, and do the transformation inside the action handler instead. This way the form sends the flat record directly, and the server transforms it. This avoids schema mismatch between form and action.

**Revised approach:** Don't transform on the client. Send the flat `answers` record to the action. Transform in the action handler (Task 5). The submit handler stays simple:

```tsx
<form
  onSubmit={form.handleSubmit((v) =>
    action.execute({ ...v, orgId, productionId, roleId }),
  )}
>
```

Move the `toFormResponses` function to the action file instead (Task 5).

**Step 4: Render custom fields after phone field**

After the phone `Controller` and before the error/submit section, add the dynamic fields. Each field type gets a different renderer. Add this block after the phone Controller, inside the FieldGroup:

```tsx
{formFields.length > 0 && formFields.map((formField) => {
  switch (formField.type) {
    case "TEXT":
      return (
        <Controller
          key={formField.id}
          name={`answers.${formField.id}`}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>
                {formField.label}
                {!formField.required && " (optional)"}
              </FieldLabel>
              {formField.description && (
                <FieldDescription>{formField.description}</FieldDescription>
              )}
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      )

    case "TEXTAREA":
      return (
        <Controller
          key={formField.id}
          name={`answers.${formField.id}`}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>
                {formField.label}
                {!formField.required && " (optional)"}
              </FieldLabel>
              {formField.description && (
                <FieldDescription>{formField.description}</FieldDescription>
              )}
              <Textarea
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      )

    case "SELECT":
      return (
        <Controller
          key={formField.id}
          name={`answers.${formField.id}`}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>
                {formField.label}
                {!formField.required && " (optional)"}
              </FieldLabel>
              {formField.description && (
                <FieldDescription>{formField.description}</FieldDescription>
              )}
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {formField.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      )

    case "CHECKBOX_GROUP":
      return (
        <Controller
          key={formField.id}
          name={`answers.${formField.id}`}
          control={form.control}
          render={({ field, fieldState }) => {
            const selected = field.value
              ? field.value.split(",")
              : []

            function toggle(option: string) {
              const next = selected.includes(option)
                ? selected.filter((s) => s !== option)
                : [...selected, option]
              field.onChange(next.join(","))
            }

            return (
              <FieldSet data-invalid={fieldState.invalid || undefined}>
                <FieldLegend variant="label">
                  {formField.label}
                  {!formField.required && " (optional)"}
                </FieldLegend>
                {formField.description && (
                  <FieldDescription>{formField.description}</FieldDescription>
                )}
                <div className="flex flex-col gap-element">
                  {formField.options.map((option) => (
                    <label
                      key={option}
                      className="flex items-center gap-2 text-label"
                    >
                      <Checkbox
                        checked={selected.includes(option)}
                        onCheckedChange={() => toggle(option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
                {fieldState.error && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </FieldSet>
            )
          }}
        />
      )

    case "TOGGLE":
      return (
        <Controller
          key={formField.id}
          name={`answers.${formField.id}`}
          control={form.control}
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid || undefined}
            >
              <div className="flex flex-col gap-1">
                <FieldLabel htmlFor={field.name}>
                  {formField.label}
                </FieldLabel>
                {formField.description && (
                  <FieldDescription>
                    {formField.description}
                  </FieldDescription>
                )}
              </div>
              <Switch
                id={field.name}
                checked={field.value === "true"}
                onCheckedChange={(checked) =>
                  field.onChange(checked ? "true" : "false")
                }
              />
              {fieldState.error && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      )
  }
})}
```

**Step 5: Verify build**

Run: `bun run build`
Expected: No type errors.

**Step 6: Commit**

```
feat: render dynamic custom form fields in submission form
```

---

### Task 4: Pass formFields to SubmissionForm from the page

The server page already has `role.formFields` available. Pass it as a prop.

**Files:**
- Modify: `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx`

**Step 1: Add formFields prop**

Update the `<SubmissionForm>` call to include `formFields`:

```tsx
<SubmissionForm
  orgId={org.id}
  productionId={production.id}
  roleId={role.id}
  orgSlug={orgSlug}
  productionSlug={productionSlug}
  formFields={role.formFields}
/>
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No type errors.

**Step 3: Commit**

```
feat: pass formFields to submission form from public page
```

---

### Task 5: Store and validate answers in create-submission action

Accept answers from the parsed input, validate required fields against the role's formFields, transform the flat record into `CustomFormResponse[]`, and write to the Submission row.

**Files:**
- Modify: `src/actions/submissions/create-submission.ts`

**Step 1: Update the action**

The role query already fetches `formFields` (it fetches the full role row). Add `formFields` to the column selection and add answers processing logic.

Update the role query to include `formFields`:

```ts
const role = await db.query.Role.findFirst({
  where: (r) => eq(r.id, roleId),
  with: {
    production: {
      columns: { id: true, organizationId: true, isOpen: true },
    },
  },
  columns: { id: true, productionId: true, isOpen: true, formFields: true },
})
```

After the `appliedStage` check, add required field validation:

```ts
// Validate required custom fields
const formFields = role.formFields ?? []
for (const field of formFields) {
  if (!field.required) continue
  const value = answers[field.id]
  if (!value || !value.trim()) {
    throw new Error(`${field.label} is required.`)
  }
}
```

Add the transform function and write answers to the insert:

```ts
// Transform flat answers to CustomFormResponse[]
const formResponses: CustomFormResponse[] = formFields
  .filter((field) => field.id in answers)
  .map((field) => {
    const value = answers[field.id] ?? ""
    switch (field.type) {
      case "TEXT":
      case "TEXTAREA":
        return {
          fieldId: field.id,
          textValue: value,
          booleanValue: null,
          optionValues: null,
        }
      case "SELECT":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: null,
          optionValues: value ? [value] : [],
        }
      case "CHECKBOX_GROUP":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: null,
          optionValues: value ? value.split(",") : [],
        }
      case "TOGGLE":
        return {
          fieldId: field.id,
          textValue: null,
          booleanValue: value === "true",
          optionValues: null,
        }
    }
  })
```

Update the `db.insert(Submission).values()` to include `answers: formResponses`.

Add `answers` to the destructured `parsedInput`:

```ts
parsedInput: {
  orgId,
  productionId,
  roleId,
  firstName,
  lastName,
  email,
  phone,
  answers,
},
```

Add the import for `CustomFormResponse`:

```ts
import type { CustomFormResponse } from "@/lib/types"
```

**Step 2: Verify build**

Run: `bun run build`
Expected: No type errors.

**Step 3: Commit**

```
feat: validate and store custom form answers in create-submission
```

---

### Task 6: Extend SubmissionWithCandidate and display answers in detail sheet

Add `answers` to the `SubmissionWithCandidate` type, wire `formFields` through the kanban, and render answers in the detail sheet.

**Files:**
- Modify: `src/lib/submission-helpers.ts`
- Modify: `src/components/productions/submission-detail-sheet.tsx`
- Modify: `src/components/productions/role-submissions.tsx`
- Modify: `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx`

**Step 1: Extend SubmissionWithCandidate**

In `src/lib/submission-helpers.ts`, add the `answers` field and import the type:

```ts
import type { CustomFormResponse } from "@/lib/types"

export interface SubmissionWithCandidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdAt: Date | string
  stageId: string
  stage: PipelineStageData | null
  answers: CustomFormResponse[]
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}
```

**Step 2: Add formFields prop to SubmissionDetailSheet**

In `src/components/productions/submission-detail-sheet.tsx`, add imports and update the Props:

```tsx
import { Separator } from "@/components/common/separator"
import type { CustomForm } from "@/lib/types"
```

Add `formFields` to Props:

```tsx
interface Props {
  submission: SubmissionWithCandidate | null
  pipelineStages: PipelineStageData[]
  formFields: CustomForm[]
  onClose: () => void
  onStageChange?: (submission: SubmissionWithCandidate) => void
}
```

Update the destructured props to include `formFields`.

After the "Submitted" section (after the closing `</div>` of the Submitted block, before the final closing `</div>` of the content container), add a "Form responses" section:

```tsx
{submission.answers.length > 0 && (
  <>
    <Separator />
    <div className="flex flex-col gap-block">
      <h3 className="font-medium text-foreground text-label">
        Form responses
      </h3>
      <div className="flex flex-col gap-element">
        {submission.answers.map((answer) => {
          const field = formFields.find(
            (f) => f.id === answer.fieldId,
          )
          if (!field) return null

          let displayValue: string
          if (
            field.type === "TEXT" ||
            field.type === "TEXTAREA"
          ) {
            displayValue = answer.textValue ?? ""
          } else if (field.type === "SELECT") {
            displayValue =
              answer.optionValues?.[0] ?? ""
          } else if (field.type === "CHECKBOX_GROUP") {
            displayValue =
              answer.optionValues?.join(", ") ?? ""
          } else {
            displayValue = answer.booleanValue
              ? "Yes"
              : "No"
          }

          if (!displayValue) return null

          return (
            <div key={answer.fieldId}>
              <p className="font-medium text-caption text-muted-foreground">
                {field.label}
              </p>
              <p className="text-label text-foreground">
                {displayValue}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  </>
)}
```

**Step 3: Wire formFields through RoleSubmissions**

In `src/components/productions/role-submissions.tsx`, add `formFields` to props:

```tsx
import type { CustomForm } from "@/lib/types"

interface Props {
  submissions: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  formFields: CustomForm[]
}
```

Update the destructured props and pass `formFields` to `SubmissionDetailSheet`:

```tsx
<SubmissionDetailSheet
  submission={selectedSubmission}
  pipelineStages={pipelineStages}
  formFields={formFields}
  onClose={() => setSelectedSubmission(null)}
  onStageChange={setSelectedSubmission}
/>
```

**Step 4: Pass formFields from the role page**

In `src/app/(app)/productions/[id]/roles/[roleId]/page.tsx`, pass `formFields`:

```tsx
<RoleSubmissions
  submissions={role.submissions}
  pipelineStages={role.pipelineStages}
  formFields={role.formFields}
/>
```

**Step 5: Verify build**

Run: `bun run build`
Expected: No type errors.

**Step 6: Commit**

```
feat: display custom form answers in submission detail sheet
```

---

### Task 7: Final verification

**Step 1: Run lint**

Run: `bun run lint`
Expected: No lint errors.

**Step 2: Run build**

Run: `bun run build`
Expected: Clean build with no errors.

**Step 3: Manual testing instructions for the user**

Tell the user to verify:

1. Visit a production settings page → custom form fields editor → confirm type labels show "Toggle" and "Checkbox group" instead of "Checkbox" and "Multi-select"
2. Create a role with custom fields of all 5 types (TEXT, TEXTAREA, SELECT, CHECKBOX_GROUP, TOGGLE), some required, some optional
3. Visit the public submission page `/s/[org]/[production]/[role]` → custom fields render after contact fields
4. Submit with missing required fields → server error shown
5. Submit with all fields filled → submission created
6. Open the submission in the admin kanban detail sheet → answers display with labels
