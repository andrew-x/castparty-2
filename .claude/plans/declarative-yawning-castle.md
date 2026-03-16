# Stage Browse — Sorting, Title & Count

## Context

The stage browse page (just shipped) shows a grid of submissions for a given pipeline stage. The title currently just says the stage name (e.g. "Applied") with no context about what's being browsed or how many candidates are in the stage. There are also no sort controls, so submissions appear in whatever order they come from the server. This change adds:

1. **Clearer title** — e.g. "Applied Stage" so it reads as browsing a stage
2. **Count badge** next to the title — e.g. "(12)" so the user sees at a glance how many candidates are here
3. **Sort controls** — dropdown to sort by name (A–Z) or submission date (newest/oldest first)

## Implementation

### 1. Update page title and add count

**Modify:** `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx`

- Change `title` from `stage.name` to `` `${stage.name} Stage` ``
- Use the `description` prop on `PageHeader` to show the count: `` `${stageSubmissions.length} candidate${stageSubmissions.length !== 1 ? "s" : ""}` ``

### 2. Add sort controls to `StageSubmissionsGrid`

**Modify:** `src/components/productions/stage-submissions-grid.tsx`

- Add `sortBy` state: `"newest" | "oldest" | "name-asc" | "name-desc"`, default `"newest"`
- Derive `sortedSubmissions` from `submissions` using a `useMemo`-style sort (React Compiler handles memoization)
  - `"newest"`: sort by `createdAt` descending
  - `"oldest"`: sort by `createdAt` ascending
  - `"name-asc"`: sort by `lastName` then `firstName` ascending
  - `"name-desc"`: sort by `lastName` then `firstName` descending
- Render a `Select` dropdown above the grid (right-aligned) using the existing `@/components/common/select`
- Use `sortedSubmissions` for the grid and for prev/next navigation

**Sort bar layout:** A flex row above the grid with the sort dropdown right-aligned:
```tsx
<div className="flex items-center justify-end">
  <Select value={sortBy} onValueChange={setSortBy}>
    <SelectTrigger size="sm" className="w-44">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="newest">Newest first</SelectItem>
      <SelectItem value="oldest">Oldest first</SelectItem>
      <SelectItem value="name-asc">Name A–Z</SelectItem>
      <SelectItem value="name-desc">Name Z–A</SelectItem>
    </SelectContent>
  </Select>
</div>
```

## Files

| Action | File |
|--------|------|
| Modify | `src/app/(app)/productions/[id]/roles/[roleId]/stages/[stageId]/page.tsx` |
| Modify | `src/components/productions/stage-submissions-grid.tsx` |

## Verification

1. Visit a stage browse page — title reads "[Stage] Stage", description shows candidate count
2. Sort dropdown defaults to "Newest first"
3. Switch to "Name A–Z" — grid reorders alphabetically by last name
4. Switch to "Oldest first" — grid reorders by submission date ascending
5. Detail sheet prev/next respects current sort order
6. After bulk move removes candidates, count updates on next refresh
