# Archive Productions

## Context

Productions currently have no lifecycle management beyond `isOpen`. Once created, they live in the listing pages forever. As an organization runs more shows, old productions clutter the Home and Productions pages. Archiving lets casting directors hide completed productions while keeping the data intact.

## Changes

### 1. Schema — add `isArchived` column

**File:** `src/lib/db/schema.ts` (line ~266)

Add `isArchived: boolean().default(false).notNull()` to the Production table, next to `isOpen`.

Then generate a Drizzle migration: `bun drizzle-kit generate`

### 2. Validation schemas — add `isArchived`

**File:** `src/lib/schemas/production.ts`

- Add `isArchived: z.boolean()` to `updateProductionFormSchema`
- Add `isArchived: z.boolean().optional()` to `updateProductionActionSchema` (it extends the form schema, so just add `.optional()` override like `isOpen`)

### 3. Update action — persist `isArchived`

**File:** `src/actions/productions/update-production.ts` (line 15, 40)

- Destructure `isArchived` from `parsedInput`
- Include it in the `.set()` call alongside `isOpen`

### 4. Settings form — add archive toggle

**File:** `src/components/productions/production-settings-form.tsx`

- Add `isArchived` to the `Props` interface and default values
- Add a `Controller` for `isArchived` with a `Switch` — label: "Archive production", description: "Archived productions are hidden from the Home and Productions pages."
- Include `isArchived` in the `hasChanges` check and `action.execute()` call

### 5. Settings page — pass `isArchived`

**File:** `src/app/(app)/productions/[id]/(production)/settings/page.tsx`

Pass `isArchived={production.isArchived}` to `ProductionSettingsForm`.

### 6. Fetch function — include `isArchived`, sort active first

**File:** `src/actions/productions/get-productions-with-submission-counts.ts`

- Add `isArchived` to the `.select()` columns
- Accept an optional `includeArchived` parameter (default `false`)
- When `includeArchived` is false, add `.where(eq(Production.isArchived, false))` (combined with the existing org filter via `and()`)
- Add `asc(Production.isArchived)` as the first `.orderBy()` clause (so non-archived sort first when showing all)

### 7. Home page — hide archived, add toggle

**File:** `src/app/(app)/home/page.tsx`

- Accept `searchParams` and read `showArchived` from it
- Pass `includeArchived: showArchived === "true"` to `getProductionsWithSubmissionCounts()`
- Add a small toggle link/button near the section heading that toggles `?showArchived=true` / removes it
- Empty state should only consider non-archived productions (so archived-only orgs still see the "create" prompt correctly)

### 8. Productions page — same pattern

**File:** `src/app/(app)/productions/page.tsx`

Same changes as the Home page: read `showArchived` search param, pass to fetch, add toggle UI.

### 9. Production card — archived visual treatment

**File:** `src/components/productions/production-card.tsx`

- Add `isArchived` to the production type interface
- When archived, apply `opacity-60` to the card and show an "Archived" badge or indicator

## Agents

- **Sonnet subagents** for parallel implementation of independent file changes (schema+migration, form component, listing pages)
- **Code reviewer agent** after implementation

## Verification

1. Run `bun drizzle-kit generate` — confirm migration is created
2. Run `bun run build` — confirm no type errors
3. Run `bun run lint` — confirm no lint issues
4. Manual checks:
   - Visit production general settings — archive toggle appears, saves correctly
   - Home page — archived productions hidden by default, toggle shows them with dimmed cards
   - Productions page — same behavior
