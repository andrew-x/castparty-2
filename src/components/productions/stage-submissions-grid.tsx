"use client"

import { UsersIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { bulkUpdateSubmissionStatus } from "@/actions/submissions/bulk-update-submission-status"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { BulkActionBar } from "@/components/productions/bulk-action-bar"
import { StageSubmissionCard } from "@/components/productions/stage-submission-card"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import day from "@/lib/dayjs"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

const MAX_BULK_SELECTION = 100

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc"

function sortSubmissions(
  items: SubmissionWithCandidate[],
  sortBy: SortOption,
): SubmissionWithCandidate[] {
  const sorted = [...items]
  switch (sortBy) {
    case "newest":
      sorted.sort(
        (a, b) => day(b.createdAt).valueOf() - day(a.createdAt).valueOf(),
      )
      break
    case "oldest":
      sorted.sort(
        (a, b) => day(a.createdAt).valueOf() - day(b.createdAt).valueOf(),
      )
      break
    case "name-asc":
      sorted.sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName),
      )
      break
    case "name-desc":
      sorted.sort(
        (a, b) =>
          b.lastName.localeCompare(a.lastName) ||
          b.firstName.localeCompare(a.firstName),
      )
      break
  }
  return sorted
}

interface Props {
  submissions: SubmissionWithCandidate[]
  sort: string
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
}

export function StageSubmissionsGrid({
  submissions,
  sort,
  pipelineStages,
  submissionFormFields,
  feedbackFormFields,
}: Props) {
  const router = useRouter()
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionWithCandidate | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const sortedSubmissions = sortSubmissions(
    submissions,
    (sort as SortOption) || "newest",
  )

  // --- Selection helpers ---

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

  // --- Detail sheet navigation ---

  const selectedIndex = selectedSubmission
    ? sortedSubmissions.findIndex((s) => s.id === selectedSubmission.id)
    : -1
  const canNavigate = sortedSubmissions.length > 1

  const handlePrev = canNavigate
    ? () => {
        const prevIdx =
          selectedIndex <= 0 ? sortedSubmissions.length - 1 : selectedIndex - 1
        setSelectedSubmission(sortedSubmissions[prevIdx])
      }
    : null

  const handleNext = canNavigate
    ? () => {
        const nextIdx =
          selectedIndex >= sortedSubmissions.length - 1 ? 0 : selectedIndex + 1
        setSelectedSubmission(sortedSubmissions[nextIdx])
      }
    : null

  // --- Bulk move ---

  const { execute: executeBulkMove, isPending: isBulkMovePending } = useAction(
    bulkUpdateSubmissionStatus,
    {
      onSuccess() {
        router.refresh()
      },
      onError() {
        router.refresh()
      },
    },
  )

  function handleBulkMove(targetStageId: string) {
    const submissionIds = Array.from(selectedIds)
    if (submissionIds.length === 0) return
    clearSelection()
    executeBulkMove({ submissionIds, stageId: targetStageId })
  }

  // --- Sync from server on refresh ---

  const [prevSubmissions, setPrevSubmissions] = useState(submissions)
  if (submissions !== prevSubmissions) {
    setPrevSubmissions(submissions)
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.id === selectedSubmission.id)
      setSelectedSubmission(updated ?? null)
    }
    const currentIds = new Set(submissions.map((s) => s.id))
    setSelectedIds((prev) => {
      const pruned = new Set<string>()
      for (const id of prev) {
        if (currentIds.has(id)) pruned.add(id)
      }
      return pruned.size === prev.size ? prev : pruned
    })
  }

  // --- Render ---

  if (submissions.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <UsersIcon />
          </EmptyMedia>
          <EmptyTitle>No candidates in this stage</EmptyTitle>
          <EmptyDescription>
            Candidates will appear here when they are moved to this stage.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-block sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {sortedSubmissions.map((submission) => (
          <StageSubmissionCard
            key={submission.id}
            submission={submission}
            isSelected={selectedIds.has(submission.id)}
            onToggleSelect={() => toggleSelection(submission.id)}
            onOpen={() => setSelectedSubmission(submission)}
          />
        ))}
      </div>

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
        onClose={() => setSelectedSubmission(null)}
        onStageChange={setSelectedSubmission}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </>
  )
}
