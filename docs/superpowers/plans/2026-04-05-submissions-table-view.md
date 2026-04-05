# Submissions Table View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a third "table" view mode to the submissions board that shows submissions in per-stage accordion tables with drag-and-drop reordering and inline stage change dropdowns.

**Architecture:** Extend the existing `production-submissions.tsx` view mode state from a boolean to a three-value union. Create a new `SubmissionTableView` component that renders inside the existing `DragDropProvider`, reusing all shared state (selection, drag handlers, dialogs, search/filter). Extract a `handleStageChange` helper for dropdown-triggered stage changes.

**Tech Stack:** React 19, @dnd-kit/react (already installed), shadcn Accordion/Table/Select/Badge/Checkbox components (all already installed), lucide-react icons, dayjs

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `src/components/productions/submission-table-view.tsx` | Table view component: accordion sections per stage, table rows with drag-and-drop, stage dropdown, checkboxes, headshot thumbnails |
| Modify | `src/components/productions/production-submissions.tsx` | Replace `compact` boolean with `viewMode` union, add third toggle item, add `handleStageChange` helper, conditionally render table view |

---

### Task 1: Refactor view mode state in production-submissions.tsx

**Files:**
- Modify: `src/components/productions/production-submissions.tsx`

- [ ] **Step 1: Replace `compact` boolean with `viewMode` state**

In `src/components/productions/production-submissions.tsx`, add the `TableIcon` import and replace the `compact` state:

Add to the lucide-react import line (line 5):
```ts
import { LayoutGridIcon, Rows3Icon, SearchIcon, TableIcon, UsersIcon } from "lucide-react"
```

Replace line 84:
```ts
const [compact, setCompact] = useState(false)
```
with:
```ts
const [viewMode, setViewMode] = useState<"grid" | "compact" | "table">("grid")
```

- [ ] **Step 2: Update the ToggleGroup to use viewMode**

Replace the entire `ToggleGroup` block (lines 456-471) with:

```tsx
<ToggleGroup
  type="single"
  variant="outline"
  size="sm"
  value={viewMode}
  onValueChange={(v) => {
    if (v) setViewMode(v as "grid" | "compact" | "table")
  }}
>
  <ToggleGroupItem value="grid" aria-label="Grid view">
    <LayoutGridIcon className="size-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="compact" aria-label="Compact view">
    <Rows3Icon className="size-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="table" aria-label="Table view">
    <TableIcon className="size-4" />
  </ToggleGroupItem>
</ToggleGroup>
```

- [ ] **Step 3: Update `compact` prop references to use viewMode**

In the `KanbanColumn` render (line 583), change:
```tsx
compact={compact}
```
to:
```tsx
compact={viewMode === "compact"}
```

- [ ] **Step 4: Run lint to verify**

Run: `bun run lint`
Expected: No errors (the `Rows3Icon` import was already present, `TableIcon` is valid in lucide-react)

- [ ] **Step 5: Commit**

```bash
git add src/components/productions/production-submissions.tsx
git commit -m "$(cat <<'EOF'
Refactor view mode from boolean to union type

Replace compact boolean with viewMode: "grid" | "compact" | "table" to
support the upcoming table view. Add TableIcon toggle button.
EOF
)"
```

---

### Task 2: Add handleStageChange helper to production-submissions.tsx

**Files:**
- Modify: `src/components/productions/production-submissions.tsx`

- [ ] **Step 1: Add the handleStageChange function**

Add this function after the `handleSelectCancel` function (after line 387):

```tsx
function handleStageChange(submissionId: string, targetStageId: string) {
  const submission = submissions.find((s) => s.id === submissionId)
  if (!submission || submission.stageId === targetStageId) return

  // If moving to REJECTED, show the reason dialog
  if (rejectedStage && targetStageId === rejectedStage.id) {
    pendingRejectRef.current = {
      type: "drag",
      submissionId,
      stageId: targetStageId,
    }
    // Optimistically move the submission before showing the dialog
    previousColumns.current = columns
    setColumns((current) => {
      const next: ColumnItems = {}
      for (const [stageId, items] of Object.entries(current)) {
        next[stageId] = items.filter((s) => s.id !== submissionId)
      }
      const movedSubmission = { ...submission, stageId: targetStageId }
      next[targetStageId] = [
        ...(next[targetStageId] ?? []),
        movedSubmission,
      ]
      return next
    })
    setRejectDialogOpen(true)
    return
  }

  // If moving to SELECTED, show the email preview dialog
  if (selectedStage && targetStageId === selectedStage.id) {
    pendingSelectRef.current = { submissionId, stageId: targetStageId }
    // Optimistically move the submission before showing the dialog
    previousColumns.current = columns
    setColumns((current) => {
      const next: ColumnItems = {}
      for (const [stageId, items] of Object.entries(current)) {
        next[stageId] = items.filter((s) => s.id !== submissionId)
      }
      const movedSubmission = { ...submission, stageId: targetStageId }
      next[targetStageId] = [
        ...(next[targetStageId] ?? []),
        movedSubmission,
      ]
      return next
    })
    setSelectDialogOpen(true)
    return
  }

  // Normal stage change — optimistic update + server call
  previousColumns.current = columns
  setColumns((current) => {
    const next: ColumnItems = {}
    for (const [stageId, items] of Object.entries(current)) {
      next[stageId] = items.filter((s) => s.id !== submissionId)
    }
    const movedSubmission = { ...submission, stageId: targetStageId }
    next[targetStageId] = [
      ...(next[targetStageId] ?? []),
      movedSubmission,
    ]
    return next
  })
  setPendingSubmissionId(submissionId)
  executeStatusChangeAsync({ submissionId, stageId: targetStageId })
}
```

- [ ] **Step 2: Run lint to verify**

Run: `bun run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/productions/production-submissions.tsx
git commit -m "$(cat <<'EOF'
Add handleStageChange helper for dropdown stage changes

Extracts stage change logic (with optimistic updates, reject dialog, and
select dialog triggers) into a reusable function for the table view's
inline stage dropdown.
EOF
)"
```

---

### Task 3: Create the SubmissionTableView component

**Files:**
- Create: `src/components/productions/submission-table-view.tsx`

- [ ] **Step 1: Create the component file**

Create `src/components/productions/submission-table-view.tsx` with the full implementation:

```tsx
"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { GripVerticalIcon } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/accordion"
import { Badge } from "@/components/common/badge"
import { Checkbox } from "@/components/common/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/common/table"
import day from "@/lib/dayjs"
import type {
  ColumnItems,
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { cn } from "@/lib/util"

interface Props {
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

const COL_WIDTHS = {
  drag: "w-10",
  checkbox: "w-10",
  name: "",
  role: "w-[20%]",
  stage: "w-36",
  submitted: "w-32",
}

export function SubmissionTableView({
  pipelineStages,
  filteredColumns,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  showRoleName,
  onSelect,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onStageChange,
}: Props) {
  const defaultExpanded = pipelineStages.map((s) => s.id)

  return (
    <div className="mx-auto w-full max-w-5xl px-block">
      <Accordion type="multiple" defaultValue={defaultExpanded}>
        {pipelineStages.map((stage) => {
          const items = filteredColumns[stage.id] ?? []
          return (
            <StageAccordion
              key={stage.id}
              stage={stage}
              items={items}
              pipelineStages={pipelineStages}
              searchActive={searchActive}
              selectedIds={selectedIds}
              pendingSubmissionId={pendingSubmissionId}
              showRoleName={showRoleName}
              onSelect={onSelect}
              onToggle={onToggle}
              onSelectAll={onSelectAll}
              onDeselectAll={onDeselectAll}
              onStageChange={onStageChange}
            />
          )
        })}
      </Accordion>
    </div>
  )
}

interface StageAccordionProps {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
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

function StageAccordion({
  stage,
  items,
  pipelineStages,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  showRoleName,
  onSelect,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onStageChange,
}: StageAccordionProps) {
  const { ref } = useDroppable({
    id: stage.id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  })

  const columnIds = items.map((item) => item.id)
  const selectedInColumn = columnIds.filter((id) => selectedIds.has(id))
  const allSelected =
    items.length > 0 && selectedInColumn.length === items.length
  const someSelected = selectedInColumn.length > 0 && !allSelected

  const headerCheckboxState: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false

  function handleHeaderCheckboxChange() {
    if (allSelected || someSelected) {
      onDeselectAll(columnIds)
    } else {
      onSelectAll(columnIds)
    }
  }

  return (
    <AccordionItem value={stage.id} ref={ref}>
      <AccordionTrigger className="gap-element">
        <div className="flex items-center gap-element">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops click from toggling accordion; Checkbox inside handles all keyboard interaction */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: stops click from toggling accordion; Checkbox inside handles all keyboard interaction */}
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={headerCheckboxState}
              onCheckedChange={handleHeaderCheckboxChange}
              aria-label={`Select all in ${stage.name}`}
            />
          </div>
          <span className="font-medium text-foreground">{stage.name}</span>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {items.length === 0 ? (
          <p className="py-4 text-center text-caption text-muted-foreground">
            {searchActive ? "No matches" : "No candidates"}
          </p>
        ) : (
          <Table>
            <colgroup>
              <col className={COL_WIDTHS.drag} />
              <col className={COL_WIDTHS.checkbox} />
              <col />
              <col className={COL_WIDTHS.role} />
              <col className={COL_WIDTHS.stage} />
              <col className={COL_WIDTHS.submitted} />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead />
                <TableHead />
                <TableHead className="text-caption">Name</TableHead>
                <TableHead className="text-caption">Role</TableHead>
                <TableHead className="text-caption">Stage</TableHead>
                <TableHead className="text-caption">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((submission, index) => (
                <SubmissionRow
                  key={submission.id}
                  submission={submission}
                  index={index}
                  stageId={stage.id}
                  pipelineStages={pipelineStages}
                  isChecked={selectedIds.has(submission.id)}
                  isPending={submission.id === pendingSubmissionId}
                  showRoleName={showRoleName}
                  onSelect={onSelect}
                  onToggle={onToggle}
                  onStageChange={onStageChange}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}

interface SubmissionRowProps {
  submission: SubmissionWithCandidate
  index: number
  stageId: string
  pipelineStages: PipelineStageData[]
  isChecked: boolean
  isPending: boolean
  showRoleName: boolean
  onSelect: (submission: SubmissionWithCandidate) => void
  onToggle: (id: string) => void
  onStageChange: (submissionId: string, targetStageId: string) => void
}

function SubmissionRow({
  submission,
  index,
  stageId,
  pipelineStages,
  isChecked,
  isPending,
  showRoleName,
  onSelect,
  onToggle,
  onStageChange,
}: SubmissionRowProps) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: submission.id,
    index,
    type: "item",
    accept: "item",
    group: stageId,
  })

  const headshotUrl = submission.headshots[0]?.url

  return (
    <TableRow
      ref={ref}
      className={cn(
        "group",
        isDragSource && "opacity-40",
        isPending && "pointer-events-none animate-pulse",
        isChecked && "bg-brand-subtle",
      )}
    >
      {/* Drag handle */}
      <TableCell>
        <div
          ref={handleRef}
          className="flex cursor-grab items-center justify-center rounded-sm p-0.5 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
        >
          <GripVerticalIcon className="size-3.5 text-muted-foreground" />
        </div>
      </TableCell>

      {/* Checkbox */}
      <TableCell>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={() => onToggle(submission.id)}
            aria-label={`Select ${submission.firstName} ${submission.lastName}`}
          />
        </div>
      </TableCell>

      {/* Name with headshot thumbnail */}
      <TableCell>
        <button
          type="button"
          onClick={() => onSelect(submission)}
          className="flex items-center gap-element"
        >
          <div className="size-7 shrink-0 overflow-hidden rounded-full bg-muted">
            {headshotUrl ? (
              // biome-ignore lint/performance/noImgElement: external R2 URLs
              <img
                src={headshotUrl}
                alt={`${submission.firstName} ${submission.lastName}`}
                className="size-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-medium text-caption text-muted-foreground">
                  {submission.firstName[0]}
                  {submission.lastName[0]}
                </span>
              </div>
            )}
          </div>
          <span className="font-medium text-foreground text-label">
            {submission.firstName} {submission.lastName}
          </span>
        </button>
      </TableCell>

      {/* Role */}
      <TableCell className="text-muted-foreground text-label">
        {showRoleName ? (submission.roleName || "\u2014") : "\u2014"}
      </TableCell>

      {/* Stage dropdown */}
      <TableCell>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            value={submission.stageId}
            onValueChange={(value) => onStageChange(submission.id, value)}
          >
            <SelectTrigger size="sm" className="text-caption">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>

      {/* Submitted date */}
      <TableCell className="text-muted-foreground text-label">
        {day(submission.createdAt).format("ll")}
      </TableCell>
    </TableRow>
  )
}
```

- [ ] **Step 2: Run lint to verify**

Run: `bun run lint`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/productions/submission-table-view.tsx
git commit -m "$(cat <<'EOF'
Add SubmissionTableView component

Per-stage accordion tables with drag-and-drop rows, inline stage dropdown,
checkboxes, headshot thumbnails, and consistent column widths via colgroup.
EOF
)"
```

---

### Task 4: Wire SubmissionTableView into production-submissions.tsx

**Files:**
- Modify: `src/components/productions/production-submissions.tsx`

- [ ] **Step 1: Add the import**

Add this import at the top of the file, near the other production component imports:

```ts
import { SubmissionTableView } from "@/components/productions/submission-table-view"
```

- [ ] **Step 2: Conditionally render table view or kanban columns**

Replace the kanban column rendering block (the `<div>` with `flex min-h-0` containing the `pipelineStages.map` of `KanbanColumn`, lines 577-594) with:

```tsx
{viewMode === "table" ? (
  <SubmissionTableView
    pipelineStages={pipelineStages}
    filteredColumns={filteredColumns}
    searchActive={query !== "" || !showAllRoles}
    selectedIds={selectedIds}
    pendingSubmissionId={pendingSubmissionId}
    showRoleName={showAllRoles}
    onSelect={selectSubmission}
    onToggle={toggleSelection}
    onSelectAll={addToSelection}
    onDeselectAll={removeFromSelection}
    onStageChange={handleStageChange}
  />
) : (
  <div className="flex min-h-0 flex-1 gap-block overflow-x-auto pb-2">
    {pipelineStages.map((stage) => (
      <KanbanColumn
        key={stage.id}
        stage={stage}
        items={filteredColumns[stage.id] ?? []}
        compact={viewMode === "compact"}
        searchActive={query !== "" || !showAllRoles}
        selectedIds={selectedIds}
        pendingSubmissionId={pendingSubmissionId}
        showRoleName={showAllRoles}
        onToggle={toggleSelection}
        onSelectAll={addToSelection}
        onDeselectAll={removeFromSelection}
        onSelect={selectSubmission}
      />
    ))}
  </div>
)}
```

- [ ] **Step 3: Run lint to verify**

Run: `bun run lint`
Expected: No errors

- [ ] **Step 4: Run build to verify types**

Run: `bun run build`
Expected: Build succeeds with no type errors

- [ ] **Step 5: Commit**

```bash
git add src/components/productions/production-submissions.tsx
git commit -m "$(cat <<'EOF'
Wire table view into submissions board

Conditionally render SubmissionTableView when viewMode is "table",
passing shared state and the handleStageChange callback for inline
stage dropdown changes.
EOF
)"
```

---

### Task 5: Manual verification checklist

This task has no code changes. The engineer should start the dev server and verify the feature end-to-end.

- [ ] **Step 1: Verify view mode toggle**

Run: `bun dev`
Navigate to a production page with submissions. Verify three toggle buttons appear (grid, compact, table). Click each — the view should switch correctly. Grid and compact should work exactly as before.

- [ ] **Step 2: Verify table view layout**

In table view, verify:
- Each stage is an accordion section, all expanded by default
- Tables have consistent column widths across all stages
- The container is centered with max-width (not full-width)
- Headshot thumbnails show circular photos or initials fallback
- Role, stage, and date columns render correctly

- [ ] **Step 3: Verify accordion expand/collapse**

Click accordion headers to collapse and expand stages. Verify smooth animation and correct content visibility.

- [ ] **Step 4: Verify row interactions**

- Click a candidate name to open the detail sheet
- Use checkboxes to select candidates — bulk action bar should appear
- Use the header checkbox to select/deselect all in a stage

- [ ] **Step 5: Verify drag-and-drop**

- Drag a row by its handle within a stage to reorder
- Drag a row to a different stage accordion section — verify it moves
- Drag to Rejected stage — verify reject dialog appears
- Drag to Selected stage — verify email preview dialog appears

- [ ] **Step 6: Verify stage dropdown**

- Use the stage dropdown on a row to change its stage
- Move to Rejected via dropdown — verify reject dialog appears
- Move to Selected via dropdown — verify email preview dialog appears
- Regular stage change via dropdown — verify submission moves immediately

- [ ] **Step 7: Verify search and filter**

- Search by name — verify table filters correctly across all stages
- Filter by role chips — verify table filters correctly
- Verify empty state text shows "No matches" when filtering produces no results
