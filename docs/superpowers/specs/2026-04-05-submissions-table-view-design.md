# Submissions Table View

## Context

The submissions board currently offers two view modes: a grid (card) view and a compact
(row) view, both rendered as kanban columns. Casting directors reviewing large numbers
of candidates need a denser, more scannable layout. A table view grouped by stage with
collapsible accordion sections gives them a spreadsheet-like experience while keeping
the drag-and-drop and stage-change workflows they already know.

## Overview

Add a third view mode ("table") to the submissions board. In this view, submissions are
displayed in tables grouped by pipeline stage. Each stage is an accordion section that
can be expanded or collapsed. Rows are draggable for reordering within a stage and
moving between stages. A stage dropdown in each row allows quick stage changes without
dragging.

## View Mode Toggle

Replace the current `compact` boolean state with a `viewMode` string union:

```ts
type ViewMode = "grid" | "compact" | "table"
```

The `ToggleGroup` in the toolbar gets a third item using `TableIcon` from lucide-react.
The existing grid and compact rendering logic stays unchanged, keyed off `viewMode`
instead of the boolean.

**File:** `src/components/productions/production-submissions.tsx`

## SubmissionTableView Component

**New file:** `src/components/productions/submission-table-view.tsx`

A client component that renders inside the existing `DragDropProvider` in
`production-submissions.tsx`. It receives filtered columns, pipeline stages, selection
state, and all the same callbacks as the kanban view.

### Layout

- Centered container with a reasonable max-width (e.g., `max-w-5xl mx-auto`)
- One accordion section per pipeline stage, ordered by `stage.order`
- All accordions expanded by default

### Accordion Headers

Each accordion trigger shows:

- Expand/collapse chevron (from shadcn Accordion)
- Stage name (bold)
- Submission count badge

Use the existing `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
from `@/components/common/accordion`.

### Table Columns

Each stage section contains a table with these columns:

| Column | Width | Content |
|--------|-------|---------|
| Drag handle | fixed ~2rem | `GripVerticalIcon`, `cursor-grab` |
| Checkbox | fixed ~2rem | Selection checkbox (same as board view) |
| Name | flex | Circular headshot thumbnail (size-7, with initials fallback) + full name |
| Role | ~20% | Role name submitted for |
| Stage | ~10rem | `Select` dropdown with all pipeline stages |
| Submitted | ~8rem | Date formatted with `day().format("ll")` |

Use `<colgroup>` with fixed widths to ensure column alignment across all stage tables.

Use the shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`,
`TableCell` components from `@/components/common/table.tsx`.

### Row Interactions

- **Click row** -> opens submission detail sheet (same side panel as board view)
- **Checkbox** -> toggles bulk selection (same as board view)
- **Drag handle** -> drag to reorder within stage or move between stages
- **Stage dropdown** -> changes the submission's stage

### Empty State

When a stage accordion has no submissions (after filtering), show a centered muted
text: "No candidates" (or "No matches" when search/filter is active).

## Drag-and-Drop

Reuses the existing `DragDropProvider` already wrapping the board in
`production-submissions.tsx`.

- Each **table row** uses `useSortable` from `@dnd-kit/react/sortable` (same hook as
  `KanbanCard`), with `group` set to the stage ID
- Each **accordion section** (the table container) uses `useDroppable` from
  `@dnd-kit/react` (same hook as `KanbanColumn`)
- The existing `onDragStart`, `onDragOver`, `onDragEnd` handlers in the parent handle
  all the optimistic updates, rollback, and special dialog triggers

This means reordering within a stage and cross-stage dragging work identically to the
board view with zero new drag logic.

## Stage Change via Dropdown

Each row has a `Select` component (from `@/components/common/select`) showing the
current stage name. When the user picks a different stage:

1. The component calls a new `onStageChange(submissionId, targetStageId)` callback
   passed down from `production-submissions.tsx`
2. This callback performs the same logic as a drag-and-drop stage move:
   - If moving to REJECTED stage -> opens reject reason dialog
   - If moving to SELECTED stage -> opens email preview dialog
   - Otherwise -> executes `updateSubmissionStatus` with optimistic update

This reuses the existing `executeStatusChangeAsync`, `pendingRejectRef`, and
`pendingSelectRef` handlers. A new helper function `handleStageChange(submissionId,
targetStageId)` will be extracted in `production-submissions.tsx` to encapsulate this
logic for both drag-end and dropdown scenarios.

## What Stays the Same

All shared state and behavior remains in `production-submissions.tsx`:

- Search query and role filtering (applied to columns before passing to table view)
- Bulk selection state (`selectedIds`, `toggleSelection`, `addToSelection`, etc.)
- Bulk action bar
- Comparison view
- Submission detail sheet
- Reject reason dialog and email preview dialog
- Optimistic column updates and rollback
- Server action hooks (`updateSubmissionStatus`, `bulkUpdateSubmissionStatus`)

## Component Props

```ts
interface SubmissionTableViewProps {
  pipelineStages: PipelineStageData[]
  filteredColumns: ColumnItems
  searchActive: boolean
  selectedIds: Set<string>
  pendingSubmissionId: string | null
  showRoleName: boolean
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: (ids: string[]) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}
```

## Files to Create

- `src/components/productions/submission-table-view.tsx` — the table view component

## Files to Modify

- `src/components/productions/production-submissions.tsx` — replace `compact` boolean
  with `viewMode` union, add third toggle item, add `handleStageChange` helper,
  conditionally render `SubmissionTableView` when `viewMode === "table"`

## Verification

1. Run `bun run build` to confirm no type errors
2. Run `bun run lint` to confirm no lint issues
3. Manual testing:
   - Toggle between grid, compact, and table views — each should render correctly
   - In table view, expand/collapse stage accordions
   - Click a row to open the detail sheet
   - Use checkboxes for bulk selection, verify bulk action bar appears
   - Drag a row within a stage to reorder
   - Drag a row to a different stage accordion — verify stage updates
   - Use the stage dropdown to move a submission — verify it moves to the new stage
   - Move to Rejected via dropdown — verify reject dialog appears
   - Move to Selected via dropdown — verify email preview dialog appears
   - Search by name — verify table filters correctly
   - Filter by role — verify table filters correctly
   - Verify column widths are consistent across all stage tables
