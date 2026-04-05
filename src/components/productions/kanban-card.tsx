"use client"

import { useSortable } from "@dnd-kit/react/sortable"
import { GripVerticalIcon } from "lucide-react"
import { Checkbox } from "@/components/common/checkbox"
import day from "@/lib/dayjs"
import type { SubmissionWithCandidate } from "@/lib/submission-helpers"
import { cn } from "@/lib/util"

interface Props {
  submission: SubmissionWithCandidate
  index: number
  column: string
  compact: boolean
  showRoleName?: boolean
  isChecked: boolean
  isPending: boolean
  onToggle: () => void
  onSelect: (s: SubmissionWithCandidate) => void
}

export function KanbanCard({
  submission,
  index,
  column,
  compact,
  showRoleName = false,
  isChecked,
  isPending,
  onToggle,
  onSelect,
}: Props) {
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
            aria-label={`Select ${submission.candidate.firstName} ${submission.candidate.lastName}`}
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
                alt={`${submission.candidate.firstName} ${submission.candidate.lastName}`}
                className="size-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <span className="font-medium text-caption text-muted-foreground">
                  {submission.candidate.firstName[0]}
                  {submission.candidate.lastName[0]}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="min-w-0 truncate font-medium text-foreground text-label">
              {submission.candidate.firstName} {submission.candidate.lastName}
            </p>
            {showRoleName && submission.roleName && (
              <p className="min-w-0 truncate text-caption text-muted-foreground">
                {submission.roleName}
              </p>
            )}
          </div>
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
            <div className="flex size-full items-center justify-center bg-muted">
              {/* biome-ignore lint/performance/noImgElement: external R2 URLs */}
              <img
                src={headshotUrl}
                alt={`${submission.candidate.firstName} ${submission.candidate.lastName}`}
                className="size-full object-contain"
                draggable={false}
              />
            </div>
          ) : (
            <div className="flex size-full items-center justify-center">
              <span className="font-medium text-heading text-muted-foreground">
                {submission.candidate.firstName[0]}
                {submission.candidate.lastName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Name + date */}
        <div className="flex flex-col gap-0.5 p-2">
          <p className="truncate font-medium text-foreground text-label">
            {submission.candidate.firstName} {submission.candidate.lastName}
          </p>
          {showRoleName && submission.roleName && (
            <p className="truncate text-caption text-muted-foreground">
              {submission.roleName}
            </p>
          )}
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
          aria-label={`Select ${submission.candidate.firstName} ${submission.candidate.lastName}`}
        />
      </div>
    </div>
  )
}
