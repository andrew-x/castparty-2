"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { move } from "@dnd-kit/helpers"
import { DragDropProvider, useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef, useState } from "react"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import day from "@/lib/dayjs"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
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
}

export function RoleSubmissions({ submissions, pipelineStages }: Props) {
  const router = useRouter()
  const [columns, setColumns] = useState(() =>
    buildColumns(submissions, pipelineStages),
  )
  const previousColumns = useRef(columns)
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(null)

  // Sync columns from props when server data changes (e.g., after router.refresh())
  const [prevSubmissions, setPrevSubmissions] = useState(submissions)
  if (submissions !== prevSubmissions) {
    setPrevSubmissions(submissions)
    setColumns(buildColumns(submissions, pipelineStages))
  }

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
    onError() {
      router.refresh()
    },
  })

  if (submissions.length === 0) {
    return (
      <p className="text-caption text-muted-foreground">No candidates yet.</p>
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
        <div className="flex gap-group overflow-x-auto pb-2">
          {pipelineStages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              items={columns[stage.id] ?? []}
              onSelect={setSelectedSubmission}
            />
          ))}
        </div>
      </DragDropProvider>

      <SubmissionDetailSheet
        submission={selectedSubmission}
        pipelineStages={pipelineStages}
        onClose={() => setSelectedSubmission(null)}
        onStageChange={setSelectedSubmission}
      />
    </>
  )
}

function KanbanColumn({
  stage,
  items,
  onSelect,
}: {
  stage: PipelineStageData
  items: SubmissionWithCandidate[]
  onSelect: (s: SubmissionWithCandidate) => void
}) {
  const { ref, isDropTarget } = useDroppable({
    id: stage.id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  })

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
      <div className="flex items-center justify-between px-1 pb-block">
        <span className="font-medium text-foreground text-label">
          {stage.name}
        </span>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="flex flex-col gap-block">
        {items.map((submission, index) => (
          <KanbanCard
            key={submission.id}
            submission={submission}
            index={index}
            column={stage.id}
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
  onSelect,
}: {
  submission: SubmissionWithCandidate
  index: number
  column: string
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
    <Button
      ref={ref}
      variant="ghost"
      onClick={() => {
        if (!isDragSource) onSelect(submission)
      }}
      className={cn(
        "h-auto w-full cursor-grab flex-col items-start rounded-lg border border-border bg-card p-block text-left hover:bg-muted/50 active:cursor-grabbing",
        isDragSource && "opacity-40",
      )}
    >
      <p className="font-medium text-foreground text-label">
        {submission.firstName} {submission.lastName}
      </p>
      <p className="text-caption text-muted-foreground">
        {day(submission.createdAt).format("LL")}
      </p>
    </Button>
  )
}
