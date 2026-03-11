# Multi-Select Kanban Cards with Bulk Move

## Context

The role page's Submission Kanban board currently supports moving one card at a time via drag-and-drop. Casting directors reviewing many candidates need to move batches of submissions between pipeline stages (e.g., advancing several candidates from "Applied" to "Callback" at once). This plan adds checkboxes to Kanban cards and a floating toolbar for bulk stage changes.

## Files to modify/create

| File | Action |
|------|--------|
| `src/lib/schemas/submission.ts` | Add `bulkUpdateSubmissionStatusSchema` |
| `src/actions/submissions/bulk-update-submission-status.ts` | **New** — bulk server action |
| `src/components/productions/role-submissions.tsx` | Add selection state, checkboxes, floating toolbar |

## Step 1: Add bulk schema

**File:** `src/lib/schemas/submission.ts`

Add alongside existing schemas:

```ts
export const bulkUpdateSubmissionStatusSchema = z.object({
  submissionIds: z.array(z.string().min(1)).min(1).max(100),
  stageId: z.string().min(1),
})
```

## Step 2: Create bulk server action

**File:** `src/actions/submissions/bulk-update-submission-status.ts` (new)

Pattern follows existing `update-submission-status.ts`:

- `secureActionClient` with `.metadata({ action: "bulk-update-submission-status" })`
- Input: `bulkUpdateSubmissionStatusSchema`
- Load all submissions by IDs using `inArray(Submission.id, submissionIds)`, joining through role → production to verify `organizationId`
- Validate target stage belongs to the same role
- Filter out submissions already at the target stage
- Use `db.batch()` (neon-http driver supports this) to execute:
  - `db.update(Submission).set({ stageId, updatedAt }).where(inArray(Submission.id, filteredIds))`
  - `db.insert(PipelineUpdate).values([...auditRecords])`
- `revalidatePath("/", "layout")` once
- Return `{ movedCount }`

## Step 3: Add selection state to `RoleSubmissions`

**File:** `src/components/productions/role-submissions.tsx`

- New state: `const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())`
- `toggleSelection(id)` — adds/removes an ID from the set
- `clearSelection()` — resets to empty set
- In the server data sync block (`submissions !== prevSubmissions`), prune `selectedIds` to remove IDs no longer in the submissions list

## Step 4: Add "Select all" to `KanbanColumn` header

Each column header gets a checkbox that selects/deselects all submissions in that column. New props on `KanbanColumn`: `selectedIds`, `onToggle`, `onSelectAll`, `onDeselectAll`.

Column header layout:

```
┌─────────────────────────────┐
│ ☐  Stage Name        [3]   │
│                             │
│  ☐  [Avatar] Name  ↗       │
│           Submitted date    │
│  ...                        │
└─────────────────────────────┘
```

- Header checkbox is **checked** when all items in that column are selected, **indeterminate** when some are selected, **unchecked** when none are
- Clicking a checked/indeterminate header checkbox deselects all in that column; clicking unchecked selects all
- Uses `Checkbox` component (Radix supports `checked="indeterminate"`)
- `aria-label={`Select all in ${stage.name}`}`

New helpers in `RoleSubmissions`:
- `selectAll(stageId)` — adds all submission IDs from that column to `selectedIds`
- `deselectAll(stageId)` — removes all submission IDs in that column from `selectedIds`

## Step 5: Add checkbox to `KanbanCard`

Add `isChecked` and `onToggle` props to `KanbanCard`.

Card layout changes: wrap existing content in a flex row with checkbox on the left.

```
┌──────────────────────────┐
│ ☐  [Avatar] Name  ↗     │
│         Submitted date   │
└──────────────────────────┘
```

Key interaction details:
- Checkbox wrapper gets `onPointerDown={e => e.stopPropagation()}` to prevent dnd-kit from intercepting (it uses pointerdown events)
- `onClick={e => e.stopPropagation()}` prevents bubbling to the card
- Selected cards get `border-primary/50 bg-brand-subtle` styling
- `aria-label={`Select ${firstName} ${lastName}`}` for accessibility

Drag-and-drop continues to work on the card body. Single-card drag moves only that card (not all selected).

## Step 6: Floating bulk action toolbar

New `BulkActionBar` component (inline in `role-submissions.tsx`). Appears when `selectedIds.size > 0`.

```
┌─────────────────────────────────────────────┐
│  3 selected    [Move to ▾]    [✕ Clear]     │
└─────────────────────────────────────────────┘
```

- Fixed at bottom center of viewport: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
- `bg-card border border-border shadow-lg rounded-lg`
- Entry animation: `animate-in fade-in slide-in-from-bottom-2`
- "Move to" uses `Popover` with `side="top"` listing all pipeline stages as buttons
- Clear button: `Button variant="ghost" size="icon"` with `XIcon` and `tooltip="Clear selection"`
- `loading` state on move button while `isBulkMovePending`

## Step 7: Wire optimistic bulk move

`handleBulkMove(targetStageId)`:
1. Save `previousColumns.current` for rollback
2. Optimistically move all selected cards from their current columns to the target column in local state
3. Clear selection
4. Call `executeBulkMove({ submissionIds, stageId })`
5. On success: `router.refresh()`
6. On error: revert to `previousColumns.current` + `router.refresh()`

## Edge cases

- **Drag a selected card:** Only that card moves (not all selected). Selection persists for remaining cards.
- **Open detail sheet while cards selected:** Works without conflict. Selection persists.
- **All selected already at target stage:** Server filters them out, returns `movedCount: 0`. Optimistic update is a no-op.
- **Server data sync:** Stale IDs pruned from `selectedIds` automatically.

## Components reused (no new common components needed)

- `Checkbox` from `@/components/common/checkbox`
- `Button` from `@/components/common/button` (tooltip, loading, leftSection)
- `Badge` from `@/components/common/badge`
- `Popover`, `PopoverContent`, `PopoverTrigger` from `@/components/common/popover`

## Design tokens used

- `bg-brand-subtle`, `border-primary/50` for selected card highlight
- `gap-element`, `gap-block`, `p-block` for spacing
- `text-label`, `text-muted-foreground` for typography
- `bg-card`, `border-border`, `shadow-lg` for toolbar

## Verification

1. Visit a role's Kanban board with multiple candidates across stages
2. Click checkboxes on 2-3 cards across different columns — toolbar appears with count
3. Click column header checkbox — all cards in that column become selected, header shows checked state
4. Select some cards in a column — header shows indeterminate state
5. Click "Move to" — pick a stage — cards move optimistically, toolbar disappears
6. Refresh page — cards persist in new column (server state correct)
7. Verify drag-and-drop still works on cards
8. Verify clicking card name still opens detail sheet
9. Verify clearing selection via X button or column header checkbox
10. Run `bun run lint` and `bun run build` — no errors
