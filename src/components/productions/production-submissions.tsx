"use client"

import { move } from "@dnd-kit/helpers"
import { DragDropProvider } from "@dnd-kit/react"
import { LayoutGridIcon, Rows3Icon, SearchIcon, UsersIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef, useState } from "react"
import { bulkUpdateSubmissionStatus } from "@/actions/submissions/bulk-update-submission-status"
import { sendSubmissionEmailAction } from "@/actions/submissions/send-submission-email"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/common/empty"
import { Input } from "@/components/common/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/common/toggle-group"
import { BulkActionBar } from "@/components/productions/bulk-action-bar"
import { ComparisonView } from "@/components/productions/comparison-view"
import { EmailPreviewDialog } from "@/components/productions/email-preview-dialog"
import { KanbanColumn } from "@/components/productions/kanban-column"
import { RejectReasonDialog } from "@/components/productions/reject-reason-dialog"
import { SubmissionDetailSheet } from "@/components/productions/submission-detail-sheet"
import { interpolateTemplate } from "@/lib/email-template"
import type {
  ColumnItems,
  OtherRoleSubmission,
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { buildColumns } from "@/lib/submission-helpers"
import type { CustomForm, EmailTemplates } from "@/lib/types"

interface Props {
  productionName: string
  organizationName: string
  emailTemplates: EmailTemplates
  roles: { id: string; name: string; slug: string }[]
  submissions: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
  rejectReasons: string[]
  otherRoleSubmissions: Record<string, OtherRoleSubmission[]>
}

export function ProductionSubmissions({
  productionName,
  organizationName,
  emailTemplates,
  roles,
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
  const [selectDialogOpen, setSelectDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [compact, setCompact] = useState(false)
  const [selectedRoleId, setSelectedRoleId] = useState("")

  // Stores pending reject info: either a single drag submission or bulk IDs
  const pendingRejectRef = useRef<
    | { type: "drag"; submissionId: string; stageId: string }
    | { type: "bulk"; submissionIds: string[]; stageId: string }
    | null
  >(null)

  // Stores pending select info for a single drag
  const pendingSelectRef = useRef<{
    submissionId: string
    stageId: string
  } | null>(null)

  const rejectedStage = pipelineStages.find((s) => s.type === "REJECTED")
  const selectedStage = pipelineStages.find((s) => s.type === "SELECTED")

  const { execute: executeSendEmail } = useAction(sendSubmissionEmailAction)

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

  const { executeAsync: executeStatusChangeAsync } = useAction(
    updateSubmissionStatus,
    {
      onSuccess() {
        setPendingSubmissionId(null)
      },
      onError() {
        setPendingSubmissionId(null)
        setColumns(previousColumns.current)
        router.refresh()
      },
    },
  )

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

  function handleRejectConfirm(
    reason: string,
    sendEmail: boolean,
    emailSubject?: string,
    emailBody?: string,
  ) {
    setRejectDialogOpen(false)
    const pending = pendingRejectRef.current
    pendingRejectRef.current = null
    if (!pending) return

    if (pending.type === "drag") {
      setPendingSubmissionId(pending.submissionId)
      executeStatusChangeAsync({
        submissionId: pending.submissionId,
        stageId: pending.stageId,
        rejectionReason: reason,
      }).then((result) => {
        if (sendEmail && result?.data) {
          executeSendEmail({
            submissionId: pending.submissionId,
            templateType: "rejected",
            customSubject: emailSubject,
            customBody: emailBody,
          })
        }
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

  function handleSelectConfirm(
    sendEmail: boolean,
    emailSubject: string,
    emailBody: string,
  ) {
    setSelectDialogOpen(false)
    const pending = pendingSelectRef.current
    pendingSelectRef.current = null
    if (!pending) return

    setPendingSubmissionId(pending.submissionId)
    executeStatusChangeAsync({
      submissionId: pending.submissionId,
      stageId: pending.stageId,
    }).then((result) => {
      if (sendEmail && result?.data) {
        executeSendEmail({
          submissionId: pending.submissionId,
          templateType: "selected",
          customSubject: emailSubject,
          customBody: emailBody,
        })
      }
    })
  }

  function handleSelectCancel() {
    setSelectDialogOpen(false)
    const pending = pendingSelectRef.current
    pendingSelectRef.current = null
    if (pending) {
      setColumns(previousColumns.current)
    }
  }

  function getEmailPreviewForSubmission(
    submissionId: string,
    templateKey: keyof typeof emailTemplates,
  ) {
    const sub = submissions.find((s) => s.id === submissionId)
    if (!sub) return { subject: "", body: "" }
    const variables = {
      first_name: sub.firstName,
      last_name: sub.lastName,
      production_name: productionName,
      role_name: sub.roleName,
      organization_name: organizationName,
    }
    return {
      subject: interpolateTemplate(
        emailTemplates[templateKey].subject,
        variables,
      ),
      body: interpolateTemplate(emailTemplates[templateKey].body, variables),
    }
  }

  // Derive filtered columns for display (search + role filter don't mutate drag state)
  const showAllRoles = selectedRoleId === "" || selectedRoleId === "all"
  const query = searchQuery.toLowerCase()
  const filteredColumns: ColumnItems = {}
  for (const [stageId, items] of Object.entries(columns)) {
    filteredColumns[stageId] = items.filter((s) => {
      const matchesRole = showAllRoles || s.roleId === selectedRoleId
      const matchesSearch = query
        ? `${s.firstName} ${s.lastName}`.toLowerCase().includes(query)
        : true
      return matchesRole && matchesSearch
    })
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
            production.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <>
      {/* Toolbar: search + role filter + view toggle */}
      <div className="flex items-center justify-between gap-block px-block pb-block">
        <div className="flex items-center gap-block">
          <div className="relative w-full max-w-sm">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {roles.length > 1 && (
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger size="sm" aria-label="Filter by role">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
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

            // If dragging to SELECTED, show the email preview dialog
            if (selectedStage && newStageId === selectedStage.id) {
              pendingSelectRef.current = {
                submissionId,
                stageId: newStageId,
              }
              setSelectDialogOpen(true)
              return
            }

            setPendingSubmissionId(submissionId)
            executeStatusChangeAsync({
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
        roleId={selectedSubmission?.roleId ?? ""}
        rejectReasons={rejectReasons}
        productionName={productionName}
        organizationName={organizationName}
        emailTemplates={emailTemplates}
        otherRoleSubmissions={otherRoleSubmissions}
        onClose={() => selectSubmission(null)}
        onStageChange={selectSubmission}
        onNavigateToSubmission={(submissionId) => {
          const target = submissions.find((s) => s.id === submissionId)
          if (target) selectSubmission(target)
        }}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <RejectReasonDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleRejectCancel()
        }}
        reasons={rejectReasons}
        emailPreview={
          pendingRejectRef.current?.type === "drag"
            ? getEmailPreviewForSubmission(
                pendingRejectRef.current.submissionId,
                "rejected",
              )
            : undefined
        }
        onConfirm={handleRejectConfirm}
      />

      <EmailPreviewDialog
        open={selectDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleSelectCancel()
        }}
        initialSubject={
          pendingSelectRef.current
            ? getEmailPreviewForSubmission(
                pendingSelectRef.current.submissionId,
                "selected",
              ).subject
            : ""
        }
        initialBody={
          pendingSelectRef.current
            ? getEmailPreviewForSubmission(
                pendingSelectRef.current.submissionId,
                "selected",
              ).body
            : ""
        }
        actionLabel="Select"
        onConfirm={handleSelectConfirm}
      />
    </>
  )
}
