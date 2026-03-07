# Plan: Add Location Field to Productions and Submissions

## Context

Productions and submissions already have a `location` text column in the DB schema (defaults to `""`), but it's not exposed in any Zod schemas, forms, or display views. We need to wire it through the full stack and provide an autocomplete experience backed by ~32.7K city names from `public/us-cities.json` (30,988) and `public/can-cities.json` (1,736).

The field is free-form text — users can type any value, but we suggest matching cities as they type.

## Approach

### 1. Generic Autocomplete Input Component

**New file:** `src/components/common/autocomplete-input.tsx`

A `"use client"` generic autocomplete component built with existing `Input` + `Popover` primitives. We cannot use the existing Combobox (`@base-ui/react`) because it constrains values to the option list — this component must allow free-form text.

**Architecture:** `Input` for typing + `Popover` for the suggestions dropdown. The consumer provides the suggestions array — the component handles filtering, display, and selection. This is a reusable design-system primitive, not location-specific.

**Props interface:**
```tsx
interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  options: string[]              // the full list of suggestions
  id?: string
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  minChars?: number              // min chars before showing suggestions (default: 2)
  maxResults?: number            // max suggestions shown (default: 20)
  emptyMessage?: string          // shown when filter matches nothing (default: "No results")
}
```

**Behavior:**
- Free-form text input — user can type any value, not constrained to options
- As user types (≥ `minChars` characters), show a popover with matching options
- Case-insensitive `startsWith` filtering, capped at `maxResults`
- Selecting a suggestion fills the input and closes the popover
- Keyboard: arrow keys navigate suggestions, Enter selects highlighted, Escape closes popover
- The popover anchors to the input and matches its width

### 2. City Data Hook

**New file:** `src/hooks/use-city-options.ts`

A hook that lazy-loads and caches the city data for use with `AutocompleteInput`.

```tsx
export function useCityOptions(): string[]
```

- On first call, fetches `/us-cities.json` and `/can-cities.json` in parallel
- Merges and caches in a module-level `Promise` (shared across all instances)
- Returns `[]` while loading, then the full array once resolved
- The JSON files in `public/` are served statically with browser caching

### 2. Schema Changes

**`src/lib/schemas/production.ts`:**
- Add `location: z.string().trim().max(200).optional()` to `createProductionFormSchema`
- Add `location: z.string().trim().max(200).optional()` to `createProductionActionSchema`
- Add `location: z.string().trim().max(200)` to `updateProductionFormSchema`
- Add `location` to `updateProductionActionSchema` (extends form schema, already inherits)

**`src/lib/schemas/submission.ts`:**
- Add `location: z.string().trim().max(200).optional()` to `submissionFormSchema`
- Inherits into `submissionActionSchema` via `.extend()`

### 3. Server Action Changes

**`src/actions/productions/create-production.ts`:**
- Destructure `location` from `parsedInput`
- Pass `location: location || ""` in the `db.insert(Production).values()` call

**`src/actions/productions/update-production.ts`:**
- Destructure `location` from `parsedInput`
- Include `location` in the `.set()` call

**`src/actions/submissions/create-submission.ts`:**
- Destructure `location` from `parsedInput`
- Pass `location: location || ""` in the `db.insert(Submission).values()` call
- Also pass `location: location || ""` when upserting Candidate

### 4. Form Changes

**`src/components/productions/create-production-form.tsx`:**
- Import `AutocompleteInput` + `useCityOptions`
- Add a `location` Controller field in step 1 ("details"), after the description field
- Label: "Location", placeholder: "e.g. Toronto, ON"
- Add `location: ""` to `defaultValues`
- Pass `location` through to `action.execute()`

**`src/components/productions/production-settings-form.tsx`:**
- Import `AutocompleteInput` + `useCityOptions`
- Add `currentLocation` to Props interface
- Add a `location` Controller field after the production name field
- Add `location: currentLocation` to `defaultValues`
- Include `location` in `hasChanges` check
- Pass `location` through to `action.execute()`

**`src/app/(app)/productions/[id]/(production)/settings/page.tsx`:**
- Pass `currentLocation={production.location}` to `ProductionSettingsForm`

**`src/components/submissions/submission-form.tsx`:**
- Import `AutocompleteInput` + `useCityOptions`
- Add a `location` Controller field after the phone field
- Label: "Location (optional)", placeholder: "e.g. Toronto, ON"
- Add `location: ""` to `defaultValues`
- Pass `location` through to `action.execute()`

### 5. Display Changes

**`src/components/productions/submission-detail-sheet.tsx`:**
- Add location display in the Contact section, after phone
- Use a `MapPinIcon` from lucide-react
- Only show if `submission.location` is non-empty

**`src/lib/submission-helpers.ts`:**
- Add `location` to `SubmissionWithCandidate` interface (check if it's already there or needs adding)

### 6. Data fetching

**`src/actions/submissions/get-public-role.ts` / `get-public-production.ts`:**
- Verify `location` is returned in the query (it should be since it's a column and queries likely return all columns, but verify)

**`src/actions/productions/get-production.ts`:**
- Verify `location` is returned

## Files to Modify

| File | Change |
|------|--------|
| `src/components/common/autocomplete-input.tsx` | **NEW** — generic autocomplete (Input + Popover) |
| `src/hooks/use-city-options.ts` | **NEW** — lazy-loads + caches city JSON data |
| `src/lib/schemas/production.ts` | Add `location` to all 4 schemas |
| `src/lib/schemas/submission.ts` | Add `location` to form + action schemas |
| `src/actions/productions/create-production.ts` | Pass `location` to DB insert |
| `src/actions/productions/update-production.ts` | Pass `location` to DB update |
| `src/actions/submissions/create-submission.ts` | Pass `location` to Submission + Candidate |
| `src/components/productions/create-production-form.tsx` | Add location field (step 1) |
| `src/components/productions/production-settings-form.tsx` | Add location field + prop |
| `src/app/(app)/productions/[id]/(production)/settings/page.tsx` | Pass `currentLocation` prop |
| `src/components/submissions/submission-form.tsx` | Add location field |
| `src/components/productions/submission-detail-sheet.tsx` | Display location |
| `src/lib/submission-helpers.ts` | Add `location` to type (if needed) |

## Subagents for Implementation

1. **Subagent A** — Build `AutocompleteInput` component + `useCityOptions` hook
2. **Subagent B** — Schema + action changes (production schemas, submission schemas, all 3 server actions)
3. **Subagent C** — Form changes (create production, settings, submission form, settings page)
4. **Subagent D** — Display changes (submission detail sheet, type updates)

A runs first (other subagents depend on the component). B can run in parallel with A (no component dependency). C depends on both A and B. D can run in parallel with C.

## Verification

1. `bun run build` — ensure no type errors
2. `bun run lint` — ensure Biome passes
3. Manual checks:
   - Visit `/productions/new` → step 1 should show Location field with city autocomplete
   - Visit `/productions/{id}/settings` → Location field with current value, save works
   - Visit `/s/{org}/{prod}/{role}` → submission form shows Location field with autocomplete
   - Submit an audition → view submission detail sheet → location should appear under Contact
