# Plan: Show per-stage submission counts on role cards

## Context

On the Productions page, each role card currently shows a single badge with the total submission count. The user wants to replace this with a horizontal breakdown showing how many submissions are at each pipeline stage — stage name on top, count underneath — so the production team can see pipeline health at a glance without clicking into each role.

## Approach

The data is already fetched. `getRolesWithSubmissions()` returns `pipelineStages` (ordered by `order`) and `submissions` (with `stageId`) for each role. The page discards this when mapping to `{ id, name, submissionCount }`. We just need to pass stage counts through and render them.

### Files to modify

1. **`src/app/(app)/productions/[id]/(production)/page.tsx`** — Compute per-stage counts and pass richer data to `RolesList`
2. **`src/components/productions/roles-list.tsx`** — Update `RoleRow` interface and render the horizontal stage breakdown

### Step 1: Update the page data mapping

In `page.tsx`, change the `roles.map()` to compute stage counts from the already-fetched data:

```ts
roles={roles.map((r) => ({
  id: r.id,
  name: r.name,
  stageCounts: r.pipelineStages.map((stage) => ({
    name: stage.name,
    type: stage.type,
    count: r.submissions.filter((s) => s.stageId === stage.id).length,
  })),
}))}
```

### Step 2: Update RolesList component

Update `RoleRow` interface:

```ts
interface StageCount {
  name: string
  type: "APPLIED" | "SELECTED" | "REJECTED" | "CUSTOM"
  count: number
}

interface RoleRow {
  id: string
  name: string
  stageCounts: StageCount[]
}
```

Update the role card layout. Replace the single badge with a horizontal row of stage counts below the role name:

```
[icon]  Role Name                              [>]
        Applied   Callback   Selected   Rejected
           5         3          1          0
```

- Stage names: `text-caption text-muted-foreground`
- Counts: `text-caption text-foreground font-medium`
- Stages with 0 count still shown (provides pipeline context), but use lighter styling
- The horizontal row uses `flex gap-group` with each stage as a vertically stacked pair (name + count, centered)
- Remove the old `Badge` for total submission count

### Reused utilities

- `PipelineStageData` type from `src/lib/submission-helpers.ts` (for the `type` field reference)
- Existing design tokens: `text-caption`, `text-muted-foreground`, `gap-group`, `gap-element`

## Verification

1. Run `bun run build` to confirm no type errors
2. Visit `/productions/[id]` — each role card should show stage names horizontally with counts underneath
3. Verify a role with 0 submissions shows stage names with all 0 counts
4. Verify stages appear in pipeline order (Applied → custom stages → Selected/Rejected)
