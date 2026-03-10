"use client"

import { CollisionPriority } from "@dnd-kit/abstract"
import { move } from "@dnd-kit/helpers"
import { DragDropProvider, useDroppable } from "@dnd-kit/react"
import { useSortable } from "@dnd-kit/react/sortable"
import { ExternalLinkIcon, UsersIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef, useState } from "react"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/avatar"
import { Badge } from "@/components/common/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
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
  const [columns, setColumns] = useState(() =>
    buildColumns(submissions, pipelineStages),
  )
  const previousColumns = useRef(columns)
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(null)

  // Sync columns and selected submission from props when server data changes
  const [prevSubmissions, setPrevSubmissions] = useState(submissions)
  if (submissions !== prevSubmissions) {
    setPrevSubmissions(submissions)
    setColumns(buildColumns(submissions, pipelineStages))
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.id === selectedSubmission.id)
      setSelectedSubmission(updated ?? null)
    }
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
        <div className="flex flex-1 min-h-0 gap-block overflow-x-auto pb-2">
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
        submissionFormFields={submissionFormFields}
        feedbackFormFields={feedbackFormFields}
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
      <div className="flex flex-1 min-h-0 flex-col gap-block overflow-y-auto">
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
    <div
      ref={ref}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-card p-block hover:bg-muted/50 active:cursor-grabbing",
        isDragSource && "opacity-40",
      )}
    >
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
  )
}
