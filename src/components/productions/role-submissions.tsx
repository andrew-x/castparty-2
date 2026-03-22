"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { move } from "@dnd-kit/helpers"
import { DragDropProvider, useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import {
  GripVerticalIcon,
  LayoutGridIcon,
  Rows3Icon,
  SearchIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef, useState } from "react"
import { bulkUpdateSubmissionStatus } from "@/actions/submissions/bulk-update-submission-status"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Badge } from "@/components/common/badge"
import { Checkbox } from "@/components/common/checkbox"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { Input } from "@/components/common/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/common/toggle-group"
import { BulkActionBar } from "@/components/productions/bulk-action-bar"
import { ComparisonView } from "@/components/productions/comparison-view"
import { RejectReasonDialog } from "@/components/productions/reject-reason-dialog"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import day from "@/lib/dayjs"
import type {
  OtherRoleSubmission,
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
  productionId: string
  roleId: string
  submissions: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
  rejectReasons: string[]
  otherRoleSubmissions: Record<string, OtherRoleSubmission[]>
}

export function RoleSubmissions({
  productionId,
  roleId,
  submissions,
  pipelineStages,
  submissionFormFields,
  feedbackFormFields,
  rejectReasons,
  otherRoleSubmissions,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [columns, setColumns] = useState(() =>
    buildColumns(submissions, pipelineStages),
  )
  const previousColumns = useRef(columns)
  const movedColumns = useRef<ColumnItems | null>(null)
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(
    null,
  )
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(() => {
      const submissionId = searchParams.get("submission")
      if (!submissionId) return null
      return submissions.find((s) => s.id === submissionId) ?? null
    })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [comparisonOpen, setComparisonOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [compact, setCompact] = useState(false)
  // Stores pending reject info: either a single drag submission or bulk IDs
  const pendingRejectRef = useRef<
    | { type: "drag"; submissionId: string; stageId: string }
    | { type: "bulk"; submissionIds: string[]; stageId: string }
    | null
  >(null)

  const rejectedStage = pipelineStages.find((s) => s.type === "REJECTED")

  function selectSubmission(submission: SubmissionWithCandidate | null) {
    setSelectedSubmission(submission)
    const params = new URLSearchParams(searchParams.toString())
    if (submission) {
      params.set("submission", submission.id)
    } else {
      params.delete("submission")
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }

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
      setPendingSubmissionId(null)
    },
    onError() {
      setPendingSubmissionId(null)
      setColumns(previousColumns.current)
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

  function handleBulkMove(targetStageId: string, rejectionReason?: string) {
    const submissionIds = Array.from(selectedIds)
    if (submissionIds.length === 0) return

    // If moving to REJECTED and no reason yet, show the dialog
    if (
      rejectedStage &&
      targetStageId === rejectedStage.id &&
      !rejectionReason
    ) {
      pendingRejectRef.current = {
        type: "bulk",
        submissionIds,
        stageId: targetStageId,
      }
      setRejectDialogOpen(true)
      return
    }

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
    executeBulkMove({
      submissionIds,
      stageId: targetStageId,
      rejectionReason,
    })
  }

  function handleRejectConfirm(reason: string) {
    setRejectDialogOpen(false)
    const pending = pendingRejectRef.current
    pendingRejectRef.current = null
    if (!pending) return

    if (pending.type === "drag") {
      setPendingSubmissionId(pending.submissionId)
      executeStatusChange({
        submissionId: pending.submissionId,
        stageId: pending.stageId,
        rejectionReason: reason,
      })
    } else {
      // Use captured submissionIds, not current selectedIds
      previousColumns.current = columns
      const idsToMove = new Set(pending.submissionIds)
      setColumns((current) => {
        const next: ColumnItems = {}
        const movedItems: SubmissionWithCandidate[] = []
        for (const [stageId, items] of Object.entries(current)) {
          const kept: SubmissionWithCandidate[] = []
          for (const item of items) {
            if (idsToMove.has(item.id)) {
              movedItems.push({ ...item, stageId: pending.stageId })
            } else {
              kept.push(item)
            }
          }
          next[stageId] = kept
        }
        next[pending.stageId] = [
          ...(next[pending.stageId] ?? []),
          ...movedItems,
        ]
        return next
      })
      clearSelection()
      executeBulkMove({
        submissionIds: pending.submissionIds,
        stageId: pending.stageId,
        rejectionReason: reason,
      })
    }
  }

  function handleRejectCancel() {
    setRejectDialogOpen(false)
    const pending = pendingRejectRef.current
    pendingRejectRef.current = null
    // If drag was pending, revert the optimistic column move
    if (pending?.type === "drag") {
      setColumns(previousColumns.current)
    }
  }

  // Derive filtered columns for display (search doesn't mutate drag state)
  const filteredColumns: ColumnItems = {}
  const query = searchQuery.toLowerCase()
  for (const [stageId, items] of Object.entries(columns)) {
    filteredColumns[stageId] = query
      ? items.filter((s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(query),
        )
      : items
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
      {/* Toolbar: search + view toggle */}
      <div className="flex items-center justify-between gap-block px-block pb-block">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={compact ? "compact" : "default"}
          onValueChange={(v) => {
            if (v) setCompact(v === "compact")
          }}
        >
          <ToggleGroupItem value="default" aria-label="Default view">
            <LayoutGridIcon className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="compact" aria-label="Compact view">
            <Rows3Icon className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <DragDropProvider
        onDragStart={() => {
          previousColumns.current = columns
        }}
        onDragOver={(event) => {
          setColumns((current) => {
            const next = move(current, event)
            movedColumns.current = next
            return next
          })
        }}
        onDragEnd={(event) => {
          if (event.canceled) {
            setColumns(previousColumns.current)
            movedColumns.current = null
            return
          }

          const { source } = event.operation
          if (!source) return

          const submissionId = String(source.id)
          const currentColumns = movedColumns.current
          movedColumns.current = null
          if (!currentColumns) return

          // Compare previous vs current columns to detect cross-stage moves.
          // We avoid reading source.group/initialGroup because React may not
          // have re-rendered the sortable with its new group prop yet.
          let originalStageId: string | null = null
          for (const [stageId, items] of Object.entries(
            previousColumns.current,
          )) {
            if (items.some((s) => s.id === submissionId)) {
              originalStageId = stageId
              break
            }
          }

          let newStageId: string | null = null
          for (const [stageId, items] of Object.entries(currentColumns)) {
            if (items.some((s) => s.id === submissionId)) {
              newStageId = stageId
              break
            }
          }

          if (originalStageId && newStageId && originalStageId !== newStageId) {
            // If dragging to REJECTED, show the reason dialog
            if (rejectedStage && newStageId === rejectedStage.id) {
              pendingRejectRef.current = {
                type: "drag",
                submissionId,
                stageId: newStageId,
              }
              setRejectDialogOpen(true)
              return
            }

            setPendingSubmissionId(submissionId)
            executeStatusChange({
              submissionId,
              stageId: newStageId,
            })
          }
        }}
      >
        <div className="flex min-h-0 flex-1 gap-block overflow-x-auto pb-2">
          {pipelineStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              items={filteredColumns[stage.id] ?? []}
              compact={compact}
              searchActive={query !== ""}
              selectedIds={selectedIds}
              pendingSubmissionId={pendingSubmissionId}
              stageHref={`/productions/${productionId}/roles/${roleId}/stages/${stage.id}`}
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
          onCompare={() => setComparisonOpen(true)}
          onClear={clearSelection}
        />
      )}

      <ComparisonView
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
        submissions={submissions.filter((s) => selectedIds.has(s.id))}
        pipelineStages={pipelineStages}
        submissionFormFields={submissionFormFields}
        onRemove={(id) => {
          setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            if (next.size < 2) setComparisonOpen(false)
            return next
          })
        }}
      />

      <SubmissionDetailSheet
        submission={selectedSubmission}
        pipelineStages={pipelineStages}
        submissionFormFields={submissionFormFields}
        feedbackFormFields={feedbackFormFields}
        roleId={roleId}
        rejectReasons={rejectReasons}
        productionId={productionId}
        otherRoleSubmissions={otherRoleSubmissions}
        onClose={() => selectSubmission(null)}
        onStageChange={selectSubmission}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <RejectReasonDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleRejectCancel()
        }}
        reasons={rejectReasons}
        onConfirm={handleRejectConfirm}
      />
    </>
  )
}

function KanbanColumn({
  stage,
  items,
  compact,
  searchActive,
  selectedIds,
  pendingSubmissionId,
  stageHref,
  onToggle,
  onSelectAll,
  onDeselectAll,
  onSelect,
}: {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  compact: boolean
  searchActive: boolean
  selectedIds: Set<string>
  pendingSubmissionId: string | null
  stageHref: string
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
        <Link
          href={stageHref}
          className="flex-1 font-medium text-foreground text-label hover:text-brand-text hover:underline"
        >
          {stage.name}
        </Link>
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

function KanbanCard({
  submission,
  index,
  column,
  compact,
  isChecked,
  isPending,
  onToggle,
  onSelect,
}: {
  submission: SubmissionWithCandidate
  index: number
  column: string
  compact: boolean
  isChecked: boolean
  isPending: boolean
  onToggle: () => void
  onSelect: (s: SubmissionWithCandidate) => void
}) {
  const { ref, handleRef, isDragSource } = useSortable({
    id: submission.id,
    index,
    type: "item",
    accept: "item",
    group: column,
  })

  const headshotUrl = submission.headshots[0]?.url

  if (compact) {
    return (
      <div
        ref={ref}
        className={cn(
          "group flex items-center gap-2 overflow-hidden rounded-md border border-border bg-card p-1.5 transition-colors hover:bg-muted/50",
          isDragSource && "opacity-40",
          isPending && "pointer-events-none animate-pulse",
          isChecked && "border-primary/50 bg-brand-subtle",
        )}
      >
        {/* Inline checkbox */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "shrink-0 opacity-0 transition-opacity group-hover:opacity-100",
            isChecked && "opacity-100",
          )}
        >
          <Checkbox
            checked={isChecked}
            onCheckedChange={onToggle}
            aria-label={`Select ${submission.firstName} ${submission.lastName}`}
          />
        </div>

        <button
          type="button"
          onClick={() => onSelect(submission)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-left"
        >
          {/* Circular thumbnail */}
          <div className="size-8 shrink-0 overflow-hidden rounded-full bg-muted">
            {headshotUrl ? (
              // biome-ignore lint/performance/noImgElement: external R2 URLs
              <img
                src={headshotUrl}
                alt={`${submission.firstName} ${submission.lastName}`}
                className="size-full object-cover"
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
          <p className="min-w-0 truncate font-medium text-foreground text-label">
            {submission.firstName} {submission.lastName}
          </p>
        </button>

        {/* Inline drag handle */}
        <div
          ref={handleRef}
          className="shrink-0 cursor-grab rounded-sm p-0.5 opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100"
        >
          <GripVerticalIcon className="size-3.5 text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-muted/50",
        isDragSource && "opacity-40",
        isPending && "pointer-events-none animate-pulse",
        isChecked && "border-primary/50 bg-brand-subtle",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(submission)}
        className="w-full cursor-pointer text-left"
      >
        {/* Headshot */}
        <div className="relative aspect-[4/3] w-full bg-muted">
          {headshotUrl ? (
            // biome-ignore lint/performance/noImgElement: external R2 URLs
            <img
              src={headshotUrl}
              alt={`${submission.firstName} ${submission.lastName}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-medium text-heading text-muted-foreground">
                {submission.firstName[0]}
                {submission.lastName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Name + date */}
        <div className="flex flex-col gap-0.5 p-2">
          <p className="truncate font-medium text-foreground text-label">
            {submission.firstName} {submission.lastName}
          </p>
          <p className="text-caption text-muted-foreground">
            {day(submission.createdAt).format("LL")}
          </p>
        </div>
      </button>

      {/* Drag handle */}
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: drag handle needs accessible label for screen readers */}
      <div
        ref={handleRef}
        className="absolute top-2 right-2 flex cursor-grab items-center justify-center rounded-sm bg-background/80 p-0.5 opacity-0 backdrop-blur-sm transition-opacity active:cursor-grabbing group-hover:opacity-100"
        aria-label="Drag to reorder"
      >
        <GripVerticalIcon className="size-3.5 text-muted-foreground" />
      </div>

      {/* Checkbox overlay */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stops pointer-down from reaching dnd-kit; Checkbox inside handles all keyboard interaction */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute top-2 left-2 flex items-center justify-center rounded-sm bg-background/80 p-0.5 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100",
          isChecked && "opacity-100",
        )}
      >
        <Checkbox
          checked={isChecked}
          onCheckedChange={onToggle}
          aria-label={`Select ${submission.firstName} ${submission.lastName}`}
        />
      </div>
    </div>
  )
}
