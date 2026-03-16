"use client"

import { Checkbox } from "@/components/common/checkbox"
import day from "@/lib/dayjs"
import type { SubmissionWithCandidate } from "@/lib/submission-helpers"
import { cn } from "@/lib/util"

interface Props {
  submission: SubmissionWithCandidate
  isSelected: boolean
  onToggleSelect: () => void
  onOpen: () => void
}

export function StageSubmissionCard({
  submission,
  isSelected,
  onToggleSelect,
  onOpen,
}: Props) {
  const initials =
    `${submission.firstName.charAt(0)}${submission.lastName.charAt(0)}`.toUpperCase()

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card transition-colors hover:bg-muted/50",
        isSelected && "border-primary/50 bg-brand-subtle",
      )}
    >
      {/* Checkbox overlay */}
      <div
        className={cn(
          "absolute top-2 left-2 z-10 opacity-0 transition-opacity group-hover:opacity-100",
          isSelected && "opacity-100",
        )}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select ${submission.firstName} ${submission.lastName}`}
        />
      </div>

      {/* Headshot area */}
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-square w-full bg-muted"
      >
        {submission.headshots[0]?.url ? (
          // biome-ignore lint/performance/noImgElement: external R2 URLs
          <img
            src={submission.headshots[0].url}
            alt={`${submission.firstName} ${submission.lastName}`}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <span className="font-medium text-heading text-muted-foreground">
              {initials}
            </span>
          </div>
        )}
      </button>

      {/* Info below headshot */}
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col gap-0.5 p-2 text-left"
      >
        <p className="truncate font-medium text-caption text-foreground">
          {submission.firstName} {submission.lastName}
        </p>
        <p className="truncate text-caption text-muted-foreground">
          {day(submission.createdAt).format("LL")}
        </p>
      </button>
    </div>
  )
}
