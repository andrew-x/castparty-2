"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserRoundPlusIcon,
  XIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef, useState } from "react"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Button } from "@/components/common/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/common/sheet"
import { ConsiderForRoleDialog } from "@/components/productions/consider-for-role-dialog"
import { FeedbackPanel } from "@/components/productions/feedback-panel"
import { RejectReasonDialog } from "@/components/productions/reject-reason-dialog"
import { StageControls } from "@/components/productions/stage-controls"
import { SubmissionInfoPanel } from "@/components/productions/submission-info-panel"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate | null
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
  roleId: string
  rejectReasons: string[]
  onClose: () => void
  onStageChange?: (submission: SubmissionWithCandidate) => void
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

export function SubmissionDetailSheet({
  submission,
  pipelineStages,
  submissionFormFields,
  feedbackFormFields,
  roleId,
  rejectReasons,
  onClose,
  onStageChange,
  onPrev,
  onNext,
}: Props) {
  const router = useRouter()
  const lightboxOpen = useRef(false)

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
  })

  const [considerDialogOpen, setConsiderDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)

  const rejectedStage = pipelineStages.find((s) => s.type === "REJECTED")

  function handleStatusChange(stageId: string, rejectionReason?: string) {
    if (!submission) return

    // Intercept moves to REJECTED stage — show dialog first
    if (rejectedStage && stageId === rejectedStage.id && !rejectionReason) {
      setRejectDialogOpen(true)
      return
    }

    executeStatusChange({
      submissionId: submission.id,
      stageId,
      rejectionReason,
    })
    const newStage = pipelineStages.find((s) => s.id === stageId) ?? null
    onStageChange?.({
      ...submission,
      stageId,
      rejectionReason: rejectionReason ?? null,
      stage: newStage,
    })
  }

  function handleRejectConfirm(reason: string) {
    if (!rejectedStage) return
    setRejectDialogOpen(false)
    handleStatusChange(rejectedStage.id, reason)
  }

  return (
    <Sheet
      open={!!submission}
      onOpenChange={(open) => {
        if (!open && !lightboxOpen.current) onClose()
      }}
    >
      <SheetContent
        className="overflow-visible p-0 sm:max-w-[75vw]"
        showCloseButton={false}
      >
        {submission && (
          <>
            <nav className="absolute top-6 -left-10 z-10 flex flex-col items-center gap-element rounded-l-lg border border-r-0 bg-card py-element shadow-md">
              <Button
                variant="ghost"
                size="icon-sm"
                tooltip="Close"
                onClick={onClose}
              >
                <XIcon />
              </Button>
              {onPrev && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  tooltip="Previous candidate"
                  onClick={onPrev}
                >
                  <ChevronLeftIcon />
                </Button>
              )}
              {onNext && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  tooltip="Next candidate"
                  onClick={onNext}
                >
                  <ChevronRightIcon />
                </Button>
              )}
            </nav>
            <SheetHeader className="border-b pb-block">
              <div className="flex items-center justify-between gap-group">
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-heading">
                    {submission.firstName} {submission.lastName}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Submission details and feedback
                  </SheetDescription>
                  <div className="mt-element flex flex-wrap items-center gap-group text-label text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MailIcon className="size-3.5" />
                      {submission.email}
                    </span>
                    {submission.phone && (
                      <span className="flex items-center gap-1">
                        <PhoneIcon className="size-3.5" />
                        {submission.phone}
                      </span>
                    )}
                    {submission.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="size-3.5" />
                        {submission.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-element">
                  <StageControls
                    submission={submission}
                    pipelineStages={pipelineStages}
                    onStageChange={handleStatusChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    leftSection={<UserRoundPlusIcon />}
                    onClick={() => setConsiderDialogOpen(true)}
                  >
                    Consider for role
                  </Button>
                  <ConsiderForRoleDialog
                    submissionId={submission.id}
                    currentRoleId={roleId}
                    open={considerDialogOpen}
                    onOpenChange={setConsiderDialogOpen}
                  />
                </div>
              </div>
            </SheetHeader>

            {submission.rejectionReason && (
              <div className="border-b bg-destructive/5 px-block py-element">
                <p className="text-destructive text-label">
                  <span className="font-medium">Reject reason:</span>{" "}
                  {submission.rejectionReason}
                </p>
              </div>
            )}

            <div className="flex min-h-0 flex-1">
              {/* Left pane: submission data */}
              <div className="flex-1 overflow-y-auto p-block">
                <SubmissionInfoPanel
                  submission={submission}
                  submissionFormFields={submissionFormFields}
                  onLightboxOpenChange={(open) => {
                    lightboxOpen.current = open
                  }}
                />
              </div>

              {/* Right pane: feedback */}
              <div className="w-96 shrink-0 border-l">
                <FeedbackPanel
                  submission={submission}
                  feedbackFormFields={feedbackFormFields}
                />
              </div>
            </div>
          </>
        )}
      </SheetContent>

      <RejectReasonDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        reasons={rejectReasons}
        onConfirm={handleRejectConfirm}
      />
    </Sheet>
  )
}
