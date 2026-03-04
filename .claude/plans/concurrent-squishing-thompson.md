# Kanban Board for Role Submissions

## Context

The role submissions page (`/productions/[id]/roles/[roleId]`) currently shows submissions as a tabbed list grouped by pipeline stage. Users change a submission's stage via a dropdown in a detail sheet. This works but doesn't give a visual overview of the pipeline. A Kanban board makes the pipeline spatial — each column is a stage, each card is a submission, and dragging between columns is the primary way to advance candidates.

## Design Decisions (from brainstorming)

- **Terminal stages are draggable** — remove the server-side guard that blocks moves from Selected/Rejected
- **Card click opens the detail sheet** — keep `SubmissionDetailSheet` for viewing contact info
- **All columns shown** — even empty stages get a column (provides drop targets and shows the full pipeline)
- **Minimal cards** — candidate name + submission date only

## Files to Modify

| File | Change |
|------|--------|
| `src/components/productions/role-submissions.tsx` | Replace Tabs-based list with Kanban board |
| `src/components/productions/submission-list.tsx` | Delete (no longer needed) |
| `src/actions/submissions/update-submission-status.ts` | Remove terminal-stage guard (lines 43-55) |

No new files needed — all Kanban components live inside `role-submissions.tsx` (or extracted into the same directory if the file gets large).

## Implementation

### Step 1: Remove terminal-stage guard from `updateSubmissionStatus`

In `src/actions/submissions/update-submission-status.ts`, delete the block at lines 43-55 that prevents transitions from SELECTED/REJECTED stages. The ownership check and target-stage validation remain.

### Step 2: Build the Kanban board in `role-submissions.tsx`

Replace the current `Tabs`/`SubmissionList` UI with a horizontal scrollable board.

**State shape:** `Record<stageId, SubmissionWithCandidate[]>` — built from the `submissions` and `pipelineStages` props. Each stage ID maps to its submissions (empty array for stages with no submissions).

**dnd-kit wiring** (using the installed `@dnd-kit/react` v0.3.x):

```
DragDropProvider
  onDragStart → snapshot state for cancel rollback
  onDragOver  → optimistic move via move() from @dnd-kit/helpers
  onDragEnd   → if canceled: restore snapshot; else: fire updateSubmissionStatus
```

**Column component** — uses `useDroppable` from `@dnd-kit/react`:
- Props: `id` (stage ID), `children`
- `type: "column"`, `accept: "item"`, `collisionPriority: CollisionPriority.Low`
- Renders: column header (stage name + count badge) + scrollable card list + empty state when no cards
- `CollisionPriority` imported from `@dnd-kit/abstract`

**Card component** — uses `useSortable` from `@dnd-kit/react/sortable`:
- Props: `id` (submission ID), `index`, `column` (stage ID), submission data, `onSelect` callback
- `type: "item"`, `accept: "item"`, `group: column`
- Renders: candidate name + formatted date
- Click calls `onSelect` to open the detail sheet
- Visual feedback: `opacity: 0.4` when `isDragSource`, `cursor-grab` / `active:cursor-grabbing`

**Layout:**
- Horizontal flex container with `overflow-x-auto` for scrolling when many stages
- Each column: fixed width (~280px), `min-h-[200px]`, `bg-muted/30 rounded-lg`
- Column header: stage name (`text-label font-medium`) + `Badge variant="secondary"` count
- Cards: `rounded-lg border bg-card p-block` with hover state (`hover:bg-muted/50`)
- Cards stacked vertically with `gap-block`

**Server action call on drag end:**
- Extract the moved submission ID and new stage ID from the `onDragEnd` event
- Only fire `updateSubmissionStatus` if the stage actually changed (`initialGroup !== group`)
- On action error: call `router.refresh()` to revert optimistic state

### Step 3: Delete `submission-list.tsx`

Remove `src/components/productions/submission-list.tsx` — it's fully replaced by the Kanban card component.

### Step 4: Update the detail sheet's `onStageChange` callback

When a user changes the stage via the detail sheet's `<Select>`, the Kanban board state needs to update too. The existing `onStageChange` callback already updates `selectedSubmission` — extend `RoleSubmissions` to also move the submission between columns in local state when the sheet fires a stage change. Or rely on `router.refresh()` which the sheet already calls on success.

**Approach:** Rely on `router.refresh()` from the sheet. The board state is derived from props on each render, so a server refresh re-renders with correct data. No extra wiring needed.

## Key Implementation Details

### Existing utilities to reuse
- `getStageBadgeProps()` and `getStageLabel()` from `@/lib/submission-helpers` — for any badge rendering on cards
- `updateSubmissionStatus` from `@/actions/submissions/update-submission-status` — the same action used today
- `day()` from `@/lib/dayjs` — for formatting submission dates
- `Badge` from `@/components/common/badge` — for column header counts
- `SubmissionDetailSheet` from `@/components/productions/submission-detail-sheet` — kept as-is

### dnd-kit imports
```ts
import { DragDropProvider } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { useDroppable } from "@dnd-kit/react"
import { CollisionPriority } from "@dnd-kit/abstract"
import { move } from "@dnd-kit/helpers"
```

### Empty state
When there are zero submissions across all stages, keep the current `<p>No submissions yet.</p>` message instead of showing an empty board.

## Verification

1. **Visual:** Visit `/productions/[id]/roles/[roleId]` — should see horizontal columns for each pipeline stage
2. **Drag-and-drop:** Drag a submission card from one column to another — the card should move optimistically and the stage should update in the database
3. **Terminal stages:** Drag a submission out of Selected or Rejected — should work (no error)
4. **Empty columns:** Stages with no submissions should show as empty columns that accept drops
5. **Detail sheet:** Click a card — the detail sheet should open with contact info and stage select
6. **Sheet stage change:** Change stage via the sheet dropdown — board should update after refresh
7. **Cancel drag:** Start dragging, press Escape — card should snap back to original position
8. **Build:** `bun run build` should pass with no errors

## Agents

- **Explore agent**: Already used for codebase research (complete)
- **dev-docs skill**: Already used for @dnd-kit/react API research (complete)
- **Code reviewer agent**: Spawn after implementation to review against project conventions
- **Librarian agent**: Spawn after implementation to update docs/FEATURES.md with the Kanban board feature
