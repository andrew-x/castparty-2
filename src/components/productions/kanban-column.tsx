"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { useDroppable } from "@dnd-kit/react"
import { Badge } from "@/components/common/badge"
import { Checkbox } from "@/components/common/checkbox"
import { KanbanCard } from "@/components/productions/kanban-card"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { cn } from "@/lib/util"

interface Props {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  compact: boolean
  searchActive: boolean
  selectedIds: Set<string>
  pendingSubmissionId: string | null
  showRoleName?: boolean
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: (ids: string[]) => void
  onSelect: (s: SubmissionWithCandidate) => void
}

export function KanbanColumn({
  stage,
  items,
  compact,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  showRoleName = false,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onSelect,
}: Props) {
  const { ref, isDropTarget } = useDroppable({
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
    // biome-ignore lint/a11y/useSemanticElements: kanban column is not a form fieldset
    <div
      ref={ref}
      role="group"
      aria-label={`${stage.name} column`}
      className={cn(
        "flex w-70 shrink-0 flex-col rounded-lg bg-muted/30 p-block transition-colors",
        isDropTarget && "bg-muted/60",
      )}
    >
      <div className="flex items-center gap-element px-1 pb-block">
        <Checkbox
          checked={headerCheckboxState}
          onCheckedChange={handleHeaderCheckboxChange}
          aria-label={`Select all in ${stage.name}`}
        />
        <span className="flex-1 font-medium text-foreground text-label">
          {stage.name}
        </span>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-block overflow-y-auto">
        {items.map((submission, index) => (
          <KanbanCard
            key={submission.id}
            submission={submission}
            index={index}
            column={stage.id}
            compact={compact}
            showRoleName={showRoleName}
            isChecked={selectedIds.has(submission.id)}
            isPending={submission.id === pendingSubmissionId}
            onToggle={() => onToggle(submission.id)}
            onSelect={onSelect}
          />
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-caption text-muted-foreground">
            {searchActive ? "No matches" : "No candidates"}
          </p>
        )}
      </div>
    </div>
  )
}
