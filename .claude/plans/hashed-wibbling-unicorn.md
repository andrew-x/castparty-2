# Plan: Add Union Status, Representation, and Restrict Links Visibility

## Context

Submission forms need three changes to better serve performing arts casting:
1. **Union status** — performers can indicate their union affiliations (AEA, SAG-AFTRA, etc.)
2. **Representation** — performers can provide their agent/manager contact info
3. **Links** — should no longer be required (only hidden or optional), same as the two new fields

These are system fields (not custom form fields), following the existing pattern of `SystemFieldConfig` toggles.

## Requirements Summary

| Field | Storage | Visibility | Notes |
|-------|---------|------------|-------|
| Union status | `text[]` on Submission | hidden / optional | Multi-select with fixed recommended values + custom entries |
| Representation | `jsonb` on Submission (`{ name, email, phone } \| null`) | hidden / optional | Mini-form: toggle → sub-fields (name required, email required, phone optional) |
| Links (existing) | `text[]` on Submission | hidden / optional | Remove "required" option |

Union recommended values (fixed, not configurable per-production): AEA, EMC, SAG-AFTRA, CAEA, ACTRA, AGMA, UDA

---

## Implementation

### Step 1: Types — `src/lib/types.ts`

**Agent: general-purpose subagent**

- Add `Representation` interface: `{ name: string; email: string; phone: string }`
- Add `unionStatus: SystemFieldVisibility` and `representation: SystemFieldVisibility` to `SystemFieldConfig`
- Update `DEFAULT_SYSTEM_FIELD_CONFIG`: add `unionStatus: "optional"`, `representation: "optional"`
- Update `SYSTEM_FIELD_LABELS`: add `unionStatus: "Union status"`, `representation: "Representation"`
- Add `SYSTEM_FIELD_ALLOWED_VISIBILITIES` constant mapping each field to its allowed visibility options (all fields get `["hidden", "optional", "required"]` except links, unionStatus, representation which get `["hidden", "optional"]`)
- Add `UNION_OPTIONS` constant: `["AEA", "EMC", "SAG-AFTRA", "CAEA", "ACTRA", "AGMA", "UDA"]`

### Step 2: DB Schema — `src/lib/db/schema.ts`

**Same subagent as Step 1**

- Add to Submission table:
  - `unionStatus: text().array().notNull().default([])`
  - `representation: jsonb().$type<Representation | null>().default(null)`
- Update Production's `systemFieldConfig` default to include `unionStatus: "optional"`, `representation: "optional"`
- Run `bunx drizzle-kit generate` to produce migration

### Step 3: Zod Schemas

**Same subagent as Steps 1-2**

**`src/lib/schemas/form-fields.ts`:**
- Add `hiddenOrOptionalSchema = z.enum(["hidden", "optional"])`
- Update `systemFieldConfigSchema`: use `hiddenOrOptionalSchema` for `links`, `unionStatus`, `representation`; keep `systemFieldVisibilitySchema` for phone, location, headshots, resume

**`src/lib/schemas/submission.ts`:**
- Add `representationSchema`:
  ```ts
  z.object({
    name: z.string().trim().min(1, "Name is required.").max(200),
    email: z.string().trim().email("Enter a valid email."),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
  })
  ```
- Add to `submissionFormSchema`:
  - `unionStatus: z.array(z.string().trim().min(1).max(100)).default([])`
  - `representation: representationSchema.nullable().default(null)`
- Add same two fields to `updateSubmissionFormSchema`

### Step 4: Server Actions

**Same subagent as Steps 1-3**

**`src/actions/submissions/create-submission.ts`:**
- Destructure `unionStatus` and `representation` from parsedInput
- Add them to the `Submission` insert values (line ~241-255)
- Remove the `sfc.links === "required"` validation block (lines 103-105) — dead code since links can no longer be required
- Merge defaults into sfc: `const sfc = { ...DEFAULT_SYSTEM_FIELD_CONFIG, ...production.systemFieldConfig }` (line 90) to handle existing productions missing the new keys

**`src/actions/submissions/update-submission.ts`:**
- Destructure `unionStatus` and `representation` from parsedInput
- Add them to the primary `Submission` update `.set()` call (line ~214-221)
- Do NOT add them to the cross-submission sync update (lines 239-254) — these are submission-specific, not candidate-level fields

### Step 5: Data Layer — `src/lib/submission-helpers.ts` + `src/actions/productions/get-production-submissions.ts`

**Same subagent as Steps 1-4**

**`src/lib/submission-helpers.ts`:**
- Add to `SubmissionWithCandidate` interface:
  - `unionStatus: string[]`
  - `representation: Representation | null` (import from types)

**`src/actions/productions/get-production-submissions.ts`:**
- Add `unionStatus: sub.unionStatus` and `representation: sub.representation as Representation | null` to the `submissions.push()` object (line ~144-167)

### Step 6: Admin UI — System Field Toggles

**Separate subagent: ui-ux-engineer**

**`src/components/productions/system-field-toggles.tsx`:**
- Import `SYSTEM_FIELD_ALLOWED_VISIBILITIES` from `@/lib/types`
- Filter `VISIBILITY_OPTIONS` per field: only show options in `SYSTEM_FIELD_ALLOWED_VISIBILITIES[field]`
- This makes links/unionStatus/representation show only Hidden and Optional toggles

### Step 7: New Components — Union Status Select + Representation Fields

**Same ui-ux-engineer subagent as Step 6**

**New: `src/components/submissions/union-status-select.tsx`:**
- Uses existing `Combobox` + `ComboboxChips` + `ComboboxChip` + `ComboboxChipsInput` from `@/components/common/combobox`
- Props: `value: string[]`, `onChange: (v: string[]) => void`
- Shows `UNION_OPTIONS` as recommended items
- `multiple` mode on the Combobox
- Custom value support: on Enter with typed text not matching any existing option, add it

**New: `src/components/submissions/representation-fields.tsx`:**
- Props: `value: Representation | null`, `onChange: (v: Representation | null) => void`, `errors?: object`
- Uses `Switch` from common components
- Switch label: "I have an agent or manager"
- When on: shows name (required), email (required), phone (optional) inputs
- When off: calls `onChange(null)`

### Step 8: Submission Form — `src/components/submissions/submission-form.tsx`

**Same ui-ux-engineer subagent as Steps 6-7**

- Import `UnionStatusSelect` and `RepresentationFields`
- Add default values: `unionStatus: []`, `representation: null`
- Remove the `sfc.links === "required"` client-side validation block (lines 204-213)
- Remove the `RequiredMarker` from the links field (line 536) — links can no longer be required
- Add union status field after location (line ~481), before custom fields:
  - Conditional on `systemFieldConfig.unionStatus !== "hidden"`
  - Controller wrapping `UnionStatusSelect`
  - Label: "Union affiliations (optional)"
  - Description: "Select your union memberships or type to add unlisted unions."
- Add representation field after union status, before custom fields:
  - Conditional on `systemFieldConfig.representation !== "hidden"`
  - Controller wrapping `RepresentationFields`
  - Label: "Representation (optional)"

### Step 9: Form Preview — `src/components/productions/submission-form-preview.tsx`

**Same ui-ux-engineer subagent as Steps 6-8**

- Add union status preview (when not hidden): disabled placeholder chips area
- Add representation preview (when not hidden): disabled switch + placeholder fields
- Remove RequiredMarker from links preview (line 115)

### Step 10: Display Components

**Same ui-ux-engineer subagent as Steps 6-9**

**`src/components/productions/submission-info-panel.tsx`:**
- After links section (line ~140), before the "Submitted" separator, add:
  - Union status section: show as comma-separated badges when `submission.unionStatus.length > 0`
  - Representation section: show name, email (mailto link), phone when `submission.representation !== null`

**`src/components/productions/comparison-view.tsx`:**
- Add `hasAnyUnionStatus` and `hasAnyRepresentation` computed booleans (line ~114)
- Add grid rows for union status and representation after links row, following same pattern

**`src/components/productions/submission-edit-form.tsx`:**
- Import `UnionStatusSelect` and `RepresentationFields`
- Add `unionStatus: submission.unionStatus` and `representation: submission.representation` to defaultValues
- Add controlled fields for both after the links field (line ~297)

### Step 11: Migration

**general-purpose subagent**

- Run `bunx drizzle-kit generate` to create the SQL migration
- Verify the migration adds the two new columns with correct defaults

---

## Backwards Compatibility

- **Existing productions** have SystemFieldConfig JSONB missing `unionStatus`/`representation` keys. Fix: use spread merge `{ ...DEFAULT_SYSTEM_FIELD_CONFIG, ...production.systemFieldConfig }` in create-submission.ts (line 90). The submission form already defaults the whole config via prop default.
- **Existing productions with `links: "required"`**: The admin UI will only show hidden/optional going forward. Existing required-links configs still work for in-flight submissions (server validation check remains harmless). Next time a CD visits settings, their links will show as "optional" in the toggle UI.
- **Existing submissions**: New columns default to `[]` and `null` respectively — no data migration needed.

## Subagent Plan

| Subagent | Type | Steps | Purpose |
|----------|------|-------|---------|
| 1 | general-purpose | 1-5, 11 | Types, DB, schemas, actions, data layer, migration |
| 2 | ui-ux-engineer | 6-10 | All UI components (toggles, new fields, form, preview, display) |

These two subagents can run in parallel after the types/schema work is done. However, since the UI depends on the types and schema, **subagent 1 should run first** (or at least Steps 1-3 must complete before subagent 2 starts).

## Verification

1. **Build check**: `bun run build` — no type errors
2. **Lint**: `bun run lint` — passes
3. **Manual testing**:
   - Visit production settings → submission form: verify union status and representation toggles appear with only Hidden/Optional options; links also only shows Hidden/Optional
   - Toggle fields to "optional" → check live preview shows the new fields
   - Visit public submission form: verify union status multi-select works (select recommended values, type custom value, remove chips)
   - Verify representation toggle + sub-form appears/disappears correctly
   - Submit a form with both fields filled → verify data appears in submission detail sheet
   - Check comparison view shows the new fields when comparing candidates
   - Edit a submission → verify union status and representation are editable
