"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { move } from "@dnd-kit/helpers"
import { DragDropProvider, useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  UsersIcon,
  XIcon,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useCallback, useRef, useState } from "react"
import { bulkUpdateSubmissionStatus } from "@/actions/submissions/bulk-update-submission-status"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/avatar"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Checkbox } from "@/components/common/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import day from "@/lib/dayjs"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"
import { cn } from "@/lib/util"

type ColumnItems = Record<string, SubmissionWithCandidate[]>

function buildColumns(
  submissions: SubmissionWithCandidate[],
  stages: PipelineStageData[],
): ColumnItems {
  const columns: ColumnItems = {}
  for (const stage of stages) {
    columns[stage.id] = []
  }
  for (const sub of submissions) {
    if (columns[sub.stageId]) {
      columns[sub.stageId].push(sub)
    }
  }
  return columns
}

interface Props {
  submissions: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
}

export function RoleSubmissions({
  submissions,
  pipelineStages,
  submissionFormFields,
  feedbackFormFields,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [columns, setColumns] = useState(() =>
    buildColumns(submissions, pipelineStages),
  )
  const previousColumns = useRef(columns)
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(() => {
      const submissionId = searchParams.get("submission")
      if (!submissionId) return null
      return submissions.find((s) => s.id === submissionId) ?? null
    })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const selectSubmission = useCallback(
    (submission: SubmissionWithCandidate | null) => {
      setSelectedSubmission(submission)
      const params = new URLSearchParams(searchParams.toString())
      if (submission) {
        params.set("submission", submission.id)
      } else {
        params.delete("submission")
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const selectedColumn = selectedSubmission
    ? (columns[selectedSubmission.stageId] ?? [])
    : []
  const selectedIndex = selectedSubmission
    ? selectedColumn.findIndex((s) => s.id === selectedSubmission.id)
    : -1

  const canNavigate = selectedColumn.length > 1

  const handlePrev = canNavigate
    ? () => {
        const prevIndex =
          selectedIndex <= 0 ? selectedColumn.length - 1 : selectedIndex - 1
        selectSubmission(selectedColumn[prevIndex])
      }
    : null
  const handleNext = canNavigate
    ? () => {
        const nextIndex =
          selectedIndex >= selectedColumn.length - 1 ? 0 : selectedIndex + 1
        selectSubmission(selectedColumn[nextIndex])
      }
    : null

  const MAX_BULK_SELECTION = 100

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < MAX_BULK_SELECTION) {
        next.add(id)
      }
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function addToSelection(ids: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        if (next.size >= MAX_BULK_SELECTION) break
        next.add(id)
      }
      return next
    })
  }

  function removeFromSelection(ids: string[]) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) {
        next.delete(id)
      }
      return next
    })
  }

  // Sync columns and selected submission from props when server data changes
  const [prevSubmissions, setPrevSubmissions] = useState(submissions)
  if (submissions !== prevSubmissions) {
    setPrevSubmissions(submissions)
    setColumns(buildColumns(submissions, pipelineStages))
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.id === selectedSubmission.id)
      setSelectedSubmission(updated ?? null)
    }
    // Prune selectedIds to remove IDs no longer in the submissions list
    const currentIds = new Set(submissions.map((s) => s.id))
    setSelectedIds((prev) => {
      const pruned = new Set<string>()
      for (const id of prev) {
        if (currentIds.has(id)) {
          pruned.add(id)
        }
      }
      if (pruned.size === prev.size) return prev
      return pruned
    })
  }

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
    onError() {
      router.refresh()
    },
  })

  const { execute: executeBulkMove, isPending: isBulkMovePending } = useAction(
    bulkUpdateSubmissionStatus,
    {
      onSuccess() {
        router.refresh()
      },
      onError() {
        setColumns(previousColumns.current)
        router.refresh()
      },
    },
  )

  function handleBulkMove(targetStageId: string) {
    const submissionIds = Array.from(selectedIds)
    if (submissionIds.length === 0) return

    // Save for rollback
    previousColumns.current = columns

    // Optimistically move all selected cards to the target column
    const idsToMove = new Set(submissionIds)
    setColumns((current) => {
      const next: ColumnItems = {}
      const movedItems: SubmissionWithCandidate[] = []

      // First pass: remove selected items from their current columns
      for (const [stageId, items] of Object.entries(current)) {
        const kept: SubmissionWithCandidate[] = []
        for (const item of items) {
          if (idsToMove.has(item.id)) {
            movedItems.push({ ...item, stageId: targetStageId })
          } else {
            kept.push(item)
          }
        }
        next[stageId] = kept
      }

      // Second pass: add moved items to the target column
      next[targetStageId] = [...(next[targetStageId] ?? []), ...movedItems]

      return next
    })

    clearSelection()
    executeBulkMove({ submissionIds, stageId: targetStageId })
  }

  if (submissions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No candidates yet</EmptyTitle>
          <EmptyDescription>
            Candidates will appear here once they submit an audition for this
            role.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <DragDropProvider
        onDragStart={() => {
          previousColumns.current = columns
        }}
        onDragOver={(event) => {
          setColumns((current) => move(current, event))
        }}
        onDragEnd={(event) => {
          if (event.canceled) {
            setColumns(previousColumns.current)
            return
          }

          const { source } = event.operation
          if (!source) return

          // dnd-kit's Sortable exposes initialGroup/group but the base
          // Draggable type doesn't include them — cast to access.
          const sortable = source as unknown as {
            initialGroup?: string
            group?: string
          }
          const fromGroup = sortable.initialGroup
          const toGroup = sortable.group

          if (fromGroup && toGroup && fromGroup !== toGroup) {
            executeStatusChange({
              submissionId: String(source.id),
              stageId: toGroup,
            })
          }
        }}
      >
        <div className="flex min-h-0 flex-1 gap-block overflow-x-auto pb-2">
          {pipelineStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              items={columns[stage.id] ?? []}
              selectedIds={selectedIds}
              onToggle={toggleSelection}
              onSelectAll={addToSelection}
              onDeselectAll={removeFromSelection}
              onSelect={selectSubmission}
            />
          ))}
        </div>
      </DragDropProvider>

      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          pipelineStages={pipelineStages}
          isBulkMovePending={isBulkMovePending}
          onMove={handleBulkMove}
          onClear={clearSelection}
        />
      )}

      <SubmissionDetailSheet
        submission={selectedSubmission}
        pipelineStages={pipelineStages}
        submissionFormFields={submissionFormFields}
        feedbackFormFields={feedbackFormFields}
        onClose={() => selectSubmission(null)}
        onStageChange={selectSubmission}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  )
}

function KanbanColumn({
  stage,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onSelect,
}: {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: (ids: string[]) => void
  onDeselectAll: (ids: string[]) => void
  onSelect: (s: SubmissionWithCandidate) => void
}) {
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
            isChecked={selectedIds.has(submission.id)}
            onToggle={() => onToggle(submission.id)}
            onSelect={onSelect}
          />
        ))}
        {items.length === 0 && (
          <p className="py-4 text-center text-caption text-muted-foreground">
            No candidates
          </p>
        )}
      </div>
    </div>
  )
}

function KanbanCard({
  submission,
  index,
  column,
  isChecked,
  onToggle,
  onSelect,
}: {
  submission: SubmissionWithCandidate
  index: number
  column: string
  isChecked: boolean
  onToggle: () => void
  onSelect: (s: SubmissionWithCandidate) => void
}) {
  const { ref, isDragSource } = useSortable({
    id: submission.id,
    index,
    type: "item",
    accept: "item",
    group: column,
  })

  return (
    <div
      ref={ref}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-block hover:bg-muted/50 active:cursor-grabbing",
        isDragSource && "opacity-40",
        isChecked && "border-primary/50 bg-brand-subtle",
      )}
    >
      <div className="flex gap-element">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="flex h-6 items-center"
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggle}
            aria-label={`Select ${submission.firstName} ${submission.lastName}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(submission)
            }}
            className="group flex items-center gap-element font-medium text-foreground text-label hover:text-brand-text"
          >
            <Avatar size="sm">
              {submission.headshots[0]?.url ? (
                <AvatarImage
                  src={submission.headshots[0].url}
                  alt={`${submission.firstName} ${submission.lastName}`}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback>
                {submission.firstName[0]}
                {submission.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="flex items-center gap-1">
              {submission.firstName} {submission.lastName}
              <ExternalLinkIcon className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
          <p className="text-caption text-muted-foreground">
            {day(submission.createdAt).format("LL")}
          </p>
        </div>
      </div>
    </div>
  )
}

function BulkActionBar({
  selectedCount,
  pipelineStages,
  isBulkMovePending,
  onMove,
  onClear,
}: {
  selectedCount: number
  pipelineStages: PipelineStageData[]
  isBulkMovePending: boolean
  onMove: (stageId: string) => void
  onClear: () => void
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <div className="fade-in slide-in-from-bottom-2 fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 animate-in items-center gap-block rounded-lg border border-border bg-card px-block py-element shadow-lg">
      <span className="text-label text-muted-foreground">
        {selectedCount} selected
      </span>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            loading={isBulkMovePending}
            rightSection={<ChevronDownIcon />}
          >
            Move to
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-48 p-1">
          <div className="flex flex-col">
            {pipelineStages.map((stage) => (
              <Button
                key={stage.id}
                variant="ghost"
                size="sm"
                className="justify-start"
                onClick={() => {
                  setPopoverOpen(false)
                  onMove(stage.id)
                }}
              >
                {stage.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="ghost"
        size="icon-sm"
        tooltip="Clear selection"
        onClick={onClear}
      >
        <XIcon />
      </Button>
    </div>
  )
}
