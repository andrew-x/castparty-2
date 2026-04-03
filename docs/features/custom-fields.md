# Custom Form Fields

> **Last verified:** 2026-04-02

## Overview

Productions define custom questions that supplement the standard submission fields (name, email, etc.) and the standard feedback fields (rating, notes). There are two independent contexts: **submission form fields** (filled by candidates when applying) and **feedback form fields** (filled by the production team when reviewing). Both are configured at the production level and shared by all roles in that production.

**Who it serves:** Casting directors who need production-specific questions (e.g., "What Shakespeare experience do you have?", "Can you attend Saturday rehearsals?") and production team members who want structured feedback criteria.

## Routes

| Path | Component | Auth | Description |
|------|-----------|------|-------------|
| `/productions/[id]/settings/submission-form` | `src/app/(app)/productions/[id]/(production)/settings/submission-form/page.tsx` | Org member | Submission form builder (system field toggles + custom fields + live preview) |
| `/productions/[id]/settings/feedback-form` | `src/app/(app)/productions/[id]/(production)/settings/feedback-form/page.tsx` | Org member | Feedback form builder (custom fields + live preview) |
| `/s/[orgSlug]/[productionSlug]/[roleSlug]` | `src/app/s/[orgSlug]/[productionSlug]/[roleSlug]/page.tsx` | None | Public submission form renders custom fields |

Custom fields are also configured during production creation (Steps 3 and 4 of the 5-step wizard in `CreateProductionForm`).

## Data Model

### Storage

Custom fields are stored as JSONB directly on the `Production` table -- no separate `form_fields` table.

| Column | Table | Type | Default | Rendered In |
|--------|-------|------|---------|-------------|
| `submissionFormFields` | `Production` | `jsonb (CustomForm[])` | `[]` | Public submission form |
| `feedbackFormFields` | `Production` | `jsonb (CustomForm[])` | `[]` | Feedback panel |
| `systemFieldConfig` | `Production` | `jsonb (SystemFieldConfig)` | All `"optional"` | Public submission form (controls system field visibility) |

### Type Definitions (`src/lib/types.ts`)

```ts
type CustomFormFieldType = "TEXT" | "TEXTAREA" | "SELECT" | "CHECKBOX_GROUP" | "TOGGLE" | "IMAGE" | "DOCUMENT" | "VIDEO"

type CustomForm = {
  id: string          // Generated ID (prefix "ff")
  type: CustomFormFieldType
  label: string
  description: string
  required: boolean
  options: string[]   // For SELECT and CHECKBOX_GROUP
  maxFiles?: number   // For IMAGE (default 5)
}

type CustomFormResponse = {
  fieldId: string
  textValue: string | null
  booleanValue: boolean | null
  optionValues: string[] | null
  fileValues: string[] | null   // For IMAGE and DOCUMENT uploads
}

type SystemFieldVisibility = "hidden" | "optional" | "required"

type SystemFieldConfig = {
  phone: SystemFieldVisibility
  location: SystemFieldVisibility
  headshots: SystemFieldVisibility
  resume: SystemFieldVisibility
  video: SystemFieldVisibility
  links: RestrictedFieldVisibility   // "hidden" | "optional" only
  unionStatus: RestrictedFieldVisibility
  representation: RestrictedFieldVisibility
}
```

### Response Storage

| Table | Column | Type |
|-------|--------|------|
| `Submission` | `answers` | `jsonb (CustomFormResponse[])` |
| `Feedback` | `answers` | `jsonb (CustomFormResponse[])` |
| `Feedback` | `formFields` | `jsonb (CustomForm[])` -- snapshot of fields at time of feedback |

### Field Types

| Type | Input Component | Value Transport | Use Case |
|------|----------------|-----------------|----------|
| `TEXT` | `Input` | `textValue` | Short single-line answers |
| `TEXTAREA` | `Textarea` | `textValue` | Long multi-line answers |
| `SELECT` | `Select` (shadcn) | `optionValues: [selected]` | Pick one from a list |
| `CHECKBOX_GROUP` | `Checkbox` group | `optionValues: [selected...]` | Pick multiple from a list |
| `TOGGLE` | `Switch` | `booleanValue` | Yes/no boolean. Switch renders to the left of the label/description |
| `IMAGE` | `HeadshotUploader` | `fileValues: [urls...]` | Photo uploads (up to `maxFiles`, default 5) |
| `DOCUMENT` | `ResumeUploader` | `fileValues: [url]` | PDF document upload |
| `VIDEO` | `Input` (URL) + `VideoEmbed` preview | `textValue` | External video link (YouTube, Vimeo, etc.) |

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/types.ts` | `CustomForm`, `CustomFormFieldType`, `CustomFormResponse`, `SystemFieldConfig` types |
| `src/lib/schemas/form-fields.ts` | Zod schemas: `customFormItemSchema`, CRUD schemas for both contexts, `systemFieldConfigSchema` |
| `src/components/productions/form-fields-editor.tsx` | `FormFieldsEditor` -- generic drag-and-drop field list; `ProductionFormFieldsEditor` -- submission form wrapper |
| `src/components/productions/default-feedback-form-fields-editor.tsx` | `ProductionFeedbackFormFieldsEditor` -- feedback form wrapper |
| `src/components/productions/form-builder.tsx` | `FormBuilder` -- layout shell for submission form (system field toggles + custom fields + preview) |
| `src/components/productions/feedback-form-builder.tsx` | `FeedbackFormBuilder` -- layout shell for feedback form (custom fields + preview) |
| `src/components/productions/system-field-toggles.tsx` | `SystemFieldToggles` -- hidden/optional/required toggle per system field |
| `src/components/productions/submission-form-preview.tsx` | Live preview of the submission form |
| `src/components/productions/feedback-form-preview.tsx` | Live preview of the feedback form |
| `src/components/submissions/custom-field-display.tsx` | `CustomFieldDisplay` -- renders a single custom field by type |
| `src/actions/productions/add-production-form-field.ts` | Add a field to `submissionFormFields` |
| `src/actions/productions/update-production-form-field.ts` | Update a field in `submissionFormFields` |
| `src/actions/productions/remove-production-form-field.ts` | Remove a field from `submissionFormFields` |
| `src/actions/productions/reorder-production-form-fields.ts` | Reorder fields in `submissionFormFields` |
| `src/actions/productions/update-production-system-field-config.ts` | Update `systemFieldConfig` |
| `src/actions/productions/add-production-feedback-form-field.ts` | Add a field to `feedbackFormFields` |
| `src/actions/productions/update-production-feedback-form-field.ts` | Update a field in `feedbackFormFields` |
| `src/actions/productions/remove-production-feedback-form-field.ts` | Remove a field from `feedbackFormFields` |
| `src/actions/productions/reorder-production-feedback-form-fields.ts` | Reorder fields in `feedbackFormFields` |

## How It Works

### Configuration Flow

```
Casting Director
  │
  ├── During production creation (wizard Steps 3 + 4)
  │     ├── Step 3: Submission Form → FormBuilder
  │     │     ├── SystemFieldToggles (hidden/optional/required per system field)
  │     │     └── FormFieldsEditor (add/edit/remove/reorder custom fields)
  │     └── Step 4: Feedback Form → FeedbackFormBuilder
  │           └── FormFieldsEditor (add/edit/remove/reorder custom fields)
  │
  └── After creation (production settings)
        ├── /settings/submission-form → ProductionFormFieldsEditor → FormBuilder
        └── /settings/feedback-form  → ProductionFeedbackFormFieldsEditor → FeedbackFormBuilder
```

### CRUD Operations

Each context (submission/feedback) has 4 server actions that follow the same pattern:

1. Validate input via Zod schema
2. Verify production belongs to user's active org (`secureActionClient`)
3. Fetch production's current field array
4. Mutate the JSONB array in memory
5. Write the updated array back to Production
6. `revalidatePath("/", "layout")`

### Form Builder UI

Two-column layout on large screens:

```
┌─────────────────────────────────┬──────────────────┐
│  Left column                    │  Right column     │
│  ┌───────────────────────────┐  │  ┌──────────────┐│
│  │ System Field Toggles      │  │  │ Live Preview ││
│  │ (submission only)         │  │  │ (sticky)     ││
│  └───────────────────────────┘  │  │              ││
│  ┌───────────────────────────┐  │  │              ││
│  │ Custom Fields Editor      │  │  └──────────────┘│
│  │ - Sortable field list     │  │                  │
│  │ - Inline expand/edit      │  │                  │
│  │ - Add field bar           │  │                  │
│  └───────────────────────────┘  │                  │
└─────────────────────────────────┴──────────────────┘
```

The `FormFieldsEditor` uses `@dnd-kit/react` for drag-and-drop reordering. Each field row shows a drag handle, type badge, label, and edit/remove buttons.

### Value Transport

Custom field values travel as flat `Record<string, string>` in the form. The server transforms them into typed `CustomFormResponse[]`:

| Field Type | Form Value | Transformed Response |
|------------|-----------|---------------------|
| TEXT, TEXTAREA | Raw string | `{ textValue: value }` |
| SELECT | Selected option string | `{ optionValues: [value] }` |
| CHECKBOX_GROUP | Comma-separated string | `{ optionValues: value.split(",") }` |
| TOGGLE | `"true"` or `"false"` | `{ booleanValue: value === "true" }` |
| VIDEO | URL string | `{ textValue: value }` |
| IMAGE, DOCUMENT | Uploaded file URLs | `{ fileValues: [url, ...] }` |

## Business Logic

### Validation

**Client-side:** Zod schema uses `z.record(z.string(), z.string())` for answers. Required field validation is done manually by walking the field list before `action.execute()`.

**Server-side:** `create-submission` walks `submissionFormFields` and validates required fields. TOGGLE fields must be `"true"` to pass; other types must be non-empty after trimming.

### System Field Config

| Field | Values | Effect |
|-------|--------|--------|
| `phone` | `hidden` / `optional` / `required` | Controls phone field in submission form |
| `location` | `hidden` / `optional` / `required` | Controls location field with city autocomplete |
| `headshots` | `hidden` / `optional` / `required` | Controls headshot uploader |
| `resume` | `hidden` / `optional` / `required` | Controls resume uploader |
| `video` | `hidden` / `optional` / `required` | Controls a single video URL input with embed preview. Default: `hidden` |
| `links` | `hidden` / `optional` | Controls links editor |
| `unionStatus` | `hidden` / `optional` | Controls union affiliation select |
| `representation` | `hidden` / `optional` | Controls representation (agent/manager) fields |

First name, last name, and email are always required (not configurable).

## UI States

| State | Behavior |
|-------|----------|
| No custom fields | "No custom fields yet." placeholder |
| Adding a field | Add button shows loading spinner |
| Editing a field | Inline editor expands below the field row |
| Removing a field | Optimistic removal; reverts on error |
| Reordering | Drag-and-drop updates local state; server action fires |
| Required field marker | Red asterisk after label |
| Validation error | Per-field error messages below each input |

## Integration Points

- [Submissions](./submissions.md) -- `submissionFormFields` and `systemFieldConfig` are rendered in the public submission form.
- [Feedback](./feedback.md) -- `feedbackFormFields` are rendered in the feedback panel.
- [Productions](./productions.md) -- Steps 3 and 4 of the create wizard use the same builder components. Settings sub-routes manage fields after creation.

## Architecture Decisions

- **JSONB on `Production`, not a normalized table.** Form fields are always fetched with their parent production. JSONB avoids join overhead and allows flexible schema evolution.
- **Production-level, not per-role.** All roles share the same form fields. Simplified from an earlier per-role design that created maintenance confusion.
- **Flat string transport.** `z.record(z.string(), z.string())` for answers keeps the Zod schema simple. Server transforms to typed `CustomFormResponse[]`.
- **Snapshot on `Feedback`.** `Feedback.formFields` stores field definitions at feedback time, so historical feedback remains readable after field changes.
- **Two builder layouts.** `FormBuilder` includes `SystemFieldToggles`; `FeedbackFormBuilder` omits them since feedback standard fields (rating, notes) are not configurable.
