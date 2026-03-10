# Plan: Candidates Page — Production & Role Filters

## Context

The candidates page has a card grid with a text search. Casting directors need to filter candidates by which production or role they applied to. A single multi-select combobox combines both productions and roles into one dropdown, grouped by production. Each production appears as a top-level option (to find anyone who applied to that production), and each role appears beneath its production (to filter by a specific role). Filters combine with the existing name/email search via AND logic.

## Files

| File | Action |
|------|--------|
| `src/actions/candidates/get-candidate-filter-options.ts` | **Create** — server function returning productions with roles |
| `src/actions/candidates/get-candidates.ts` | Modify — add `productionIds`/`roleIds` params, subquery filter |
| `src/components/candidates/candidate-filters.tsx` | **Create** — client component with single multi-select combobox |
| `src/components/candidates/candidates-grid.tsx` | Modify — add filter to toolbar, preserve filter params in pagination |
| `src/app/(app)/candidates/page.tsx` | Modify — parse filter URL params, fetch filter options, pass through |

## URL Format

```
?search=john&productions=id1,id2&roles=id3,id4&page=1
```

Two separate params for productions vs roles (keeps query logic clean). Comma-separated UUIDs. Page resets to 1 on any filter change.

## Step 1: Create `getCandidateFilterOptions()`

**File:** `src/actions/candidates/get-candidate-filter-options.ts`

Plain server function (read-only, no `next-safe-action`). Returns productions with their roles for the current org.

```ts
"use server"
// checkAuth(), get orgId
// db.query.Production.findMany({
//   where: eq(Production.organizationId, orgId),
//   columns: { id: true, name: true },
//   orderBy: desc(Production.createdAt),
//   with: { roles: { columns: { id: true, name: true } } },
// })
```

Return type: `{ id: string; name: string; roles: { id: string; name: string }[] }[]`

## Step 2: Update `getCandidates()` with filter params

**File:** `src/actions/candidates/get-candidates.ts`

Add to `GetCandidatesParams`:
- `productionIds?: string[]`
- `roleIds?: string[]`

Add imports: `inArray` from `drizzle-orm`, `Submission` from schema.

Filter logic — **OR across all selections**. A candidate matches if they have a submission to ANY selected production or ANY selected role.

Build a single subquery with OR conditions:
- Collect `inArray(Submission.productionId, productionIds)` if productions selected
- Collect `inArray(Submission.roleId, roleIds)` if roles selected
- Combine with `or(...)`

Wrap in: `inArray(Candidate.id, db.selectDistinct({ id: Submission.candidateId }).from(Submission).where(or(...conditions)))`

This generates `WHERE candidate.id IN (SELECT DISTINCT candidate_id FROM submission WHERE production_id IN (...) OR role_id IN (...))`.

## Step 3: Create `CandidateFilters` client component

**File:** `src/components/candidates/candidate-filters.tsx`

`"use client"` component. **Single** multi-select combobox combining productions and roles.

**Props:**
```ts
interface FilterOption {
  id: string
  name: string
  roles: { id: string; name: string }[]
}

interface Props {
  productions: FilterOption[]
}
```

**Dropdown structure (grouped by production):**
```
┌──────────────────────────────┐
│ 🔍 Search...                 │
├──────────────────────────────┤
│ West Side Story              │  ← production (selectable, value="p:id1")
│   West Side Story / Tony     │  ← role (selectable, value="r:id2")
│   West Side Story / Maria    │
│   West Side Story / Anita    │
│                              │
│ Hamlet                       │  ← production
│   Hamlet / Hamlet            │  ← role
│   Hamlet / Ophelia           │
└──────────────────────────────┘
```

**Value encoding:** Each option value is prefixed: `p:<productionId>` or `r:<roleId>`. This lets a single combobox manage both types. On selection change, the component splits the values by prefix and writes to separate `productions` and `roles` URL params.

**Behavior:**
- Reads initial selection from `useSearchParams()` — reconstructs `p:` and `r:` prefixed values from the two URL params
- On change → split values by prefix, update both URL params via `router.replace()`, reset page to 1
- Productions rendered with `ComboboxGroup` + `ComboboxLabel` for grouping
- Production-level items are bold/emphasized to distinguish from role items
- Role items indented or prefixed with production name: `"Production / Role"`
- No debounce (discrete selections)

**Components from `src/components/common/combobox.tsx`:**
`Combobox` (root, `multiple`), `ComboboxChips`, `ComboboxChip`, `ComboboxChipsInput`, `ComboboxContent`, `ComboboxList`, `ComboboxItem`, `ComboboxGroup`, `ComboboxLabel`, `ComboboxEmpty`

**Note:** Invoke dev-docs skill during implementation to verify `@base-ui/react` Combobox controlled multi-select API.

## Step 4: Update `CandidatesGrid`

**File:** `src/components/candidates/candidates-grid.tsx`

- Add `productions` (filter options) and `selectedProductions`/`selectedRoles` (string arrays) to `Props`
- Render `CandidateFilters` alongside `CandidateSearch`:
  ```
  <div className="flex flex-wrap items-start gap-element">
    <CandidateSearch defaultValue={search} />
    <CandidateFilters productions={productions} />
  </div>
  ```
- Preserve filter params in pagination links:
  ```ts
  ...(selectedProductions.length && { productions: selectedProductions.join(",") })
  ...(selectedRoles.length && { roles: selectedRoles.join(",") })
  ```
- Empty state: when filters active but no results → "No candidates match your filters."

## Step 5: Update page server component

**File:** `src/app/(app)/candidates/page.tsx`

- Add `productions` and `roles` to `searchParams` type
- Parse: `params.productions?.split(",").filter(Boolean) ?? []`
- Fetch `getCandidateFilterOptions()` in parallel with `getCandidates()` via `Promise.all`
- Pass `productionIds` and `roleIds` to `getCandidates()`
- Pass `filterOptions`, `selectedProductions`, `selectedRoles` to `CandidatesGrid`
- Update empty-state condition: show grid (not hero empty) when any filter is active

## Existing code to reuse

- `CandidateSearch` (`src/components/candidates/candidate-search.tsx`) — URL param update pattern
- `Combobox` primitives (`src/components/common/combobox.tsx`) — multi-select UI
- `getProductions()` pattern (`src/actions/productions/get-productions.ts`) — server function pattern

## Verification

1. `bun run build` — no type errors (pre-existing candidate detail error is unrelated)
2. `bun run lint` — no new Biome errors
3. Manual checks at `/candidates`:
   - Filter dropdown shows productions and roles grouped together
   - Productions appear as top-level items, roles appear as "Production / Role" beneath
   - Selecting a production filters to candidates who applied to that production
   - Selecting a specific role filters to candidates who applied to that role
   - Multiple selections combine with OR (any match)
   - Filters combine with text search via AND
   - Pagination links preserve active filters
   - URL is shareable/bookmarkable
   - Clearing all chips shows all candidates again
