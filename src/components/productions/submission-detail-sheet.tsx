"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useRef, useState } from "react"
import { sendSubmissionEmailAction } from "@/actions/submissions/send-submission-email"
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
import { EmailPreviewDialog } from "@/components/productions/email-preview-dialog"
import { FeedbackPanel } from "@/components/productions/feedback-panel"
import { RejectReasonDialog } from "@/components/productions/reject-reason-dialog"
import { StageControls } from "@/components/productions/stage-controls"
import { SubmissionActionsMenu } from "@/components/productions/submission-actions-menu"
import { SubmissionEditForm } from "@/components/productions/submission-edit-form"
import { SubmissionInfoPanel } from "@/components/productions/submission-info-panel"
import { interpolateTemplate } from "@/lib/email-template"
import type {
  OtherRoleSubmission,
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm, EmailTemplates } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate | null
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  feedbackFormFields: CustomForm[]
  roleId?: string
  rejectReasons: string[]
  productionId: string
  productionName: string
  organizationName: string
  emailTemplates: EmailTemplates
  otherRoleSubmissions: Record<string, OtherRoleSubmission[]>
  onClose: () => void
  onStageChange?: (submission: SubmissionWithCandidate) => void
  onNavigateToSubmission?: (submissionId: string) => void
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
  productionId,
  productionName,
  organizationName,
  emailTemplates,
  otherRoleSubmissions,
  onClose,
  onStageChange,
  onNavigateToSubmission,
  onPrev,
  onNext,
}: Props) {
  const router = useRouter()
  const lightboxOpen = useRef(false)

  const { executeAsync: executeStatusChange } = useAction(
    updateSubmissionStatus,
    {
      onSuccess() {
        router.refresh()
      },
    },
  )

  const { execute: executeSendEmail } = useAction(sendSubmissionEmailAction)

  const [isEditing, setIsEditing] = useState(false)
  const [considerDialogOpen, setConsiderDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectDialogOpen, setSelectDialogOpen] = useState(false)
  const pendingSelectStageId = useRef<string | null>(null)
  const prevSubmissionId = useRef(submission?.id)

  // Exit edit mode when navigating between submissions
  if (submission?.id !== prevSubmissionId.current) {
    prevSubmissionId.current = submission?.id
    if (isEditing) setIsEditing(false)
  }

  const rejectedStage = pipelineStages.find((s) => s.type === "REJECTED")
  const selectedStage = pipelineStages.find((s) => s.type === "SELECTED")

  function getTemplateVariables(): Record<string, string> {
    if (!submission) {
      return {
        first_name: "",
        last_name: "",
        production_name: "",
        role_name: "",
      }
    }
    return {
      first_name: submission.firstName,
      last_name: submission.lastName,
      production_name: productionName,
      role_name: submission.roleName,
      organization_name: organizationName,
    }
  }

  function handleStatusChange(stageId: string, rejectionReason?: string) {
    if (!submission) return

    // Intercept moves to REJECTED stage — show dialog first
    if (rejectedStage && stageId === rejectedStage.id && !rejectionReason) {
      setRejectDialogOpen(true)
      return
    }

    // Intercept moves to SELECTED stage — show email preview first
    if (
      selectedStage &&
      stageId === selectedStage.id &&
      submission.stageId !== selectedStage.id
    ) {
      pendingSelectStageId.current = stageId
      setSelectDialogOpen(true)
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

  async function handleRejectConfirm(
    reason: string,
    sendEmail: boolean,
    emailSubject?: string,
    emailBody?: string,
  ) {
    if (!rejectedStage || !submission) return
    setRejectDialogOpen(false)

    const newStage =
      pipelineStages.find((s) => s.id === rejectedStage.id) ?? null
    onStageChange?.({
      ...submission,
      stageId: rejectedStage.id,
      rejectionReason: reason,
      stage: newStage,
    })

    const result = await executeStatusChange({
      submissionId: submission.id,
      stageId: rejectedStage.id,
      rejectionReason: reason,
    })

    if (sendEmail && result?.data) {
      executeSendEmail({
        submissionId: submission.id,
        templateType: "rejected",
        customSubject: emailSubject,
        customBody: emailBody,
      })
    }
  }

  async function handleSelectConfirm(
    sendEmail: boolean,
    emailSubject: string,
    emailBody: string,
  ) {
    const stageId = pendingSelectStageId.current
    if (!stageId || !submission) return
    pendingSelectStageId.current = null
    setSelectDialogOpen(false)

    const newStage = pipelineStages.find((s) => s.id === stageId) ?? null
    onStageChange?.({
      ...submission,
      stageId,
      rejectionReason: null,
      stage: newStage,
    })

    const result = await executeStatusChange({
      submissionId: submission.id,
      stageId,
    })

    if (sendEmail && result?.data) {
      executeSendEmail({
        submissionId: submission.id,
        templateType: "selected",
        customSubject: emailSubject,
        customBody: emailBody,
      })
    }
  }

  const variables = getTemplateVariables()
  const rejectPreview = submission
    ? {
        subject: interpolateTemplate(
          emailTemplates.rejected.subject,
          variables,
        ),
        body: interpolateTemplate(emailTemplates.rejected.body, variables),
      }
    : undefined
  const selectPreview = submission
    ? {
        subject: interpolateTemplate(
          emailTemplates.selected.subject,
          variables,
        ),
        body: interpolateTemplate(emailTemplates.selected.body, variables),
      }
    : { subject: "", body: "" }

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
        onInteractOutside={(e) => {
          if (lightboxOpen.current) e.preventDefault()
        }}
      >
        {submission && (
          <>
            <nav className="absolute top-6 -left-10 z-10 flex flex-col items-center gap-element rounded-l-lg border border-r-0 bg-card py-element shadow-md">
              <Button
                variant="ghost"
                size="icon-sm"
                tooltip="Close"
                tooltipDirection="right"
                onClick={onClose}
              >
                <XIcon />
              </Button>
              {onPrev && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  tooltip="Previous candidate"
                  tooltipDirection="right"
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
                  tooltipDirection="right"
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
                    <Link
                      href={`/candidates/${submission.candidate.id}`}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      {submission.firstName} {submission.lastName}
                      <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                    </Link>
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Submission details and feedback
                  </SheetDescription>
                  {!isEditing && (
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
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-element">
                  {!isEditing && (
                    <>
                      <StageControls
                        submission={submission}
                        pipelineStages={pipelineStages}
                        onStageChange={handleStatusChange}
                      />
                      <SubmissionActionsMenu
                        onEdit={() => setIsEditing(true)}
                        onConsiderForRole={() => setConsiderDialogOpen(true)}
                      />
                    </>
                  )}
                  <ConsiderForRoleDialog
                    submissionId={submission.id}
                    currentRoleId={roleId ?? submission?.roleId ?? ""}
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
              {/* Left pane: submission data or edit form */}
              <div className="flex-1 overflow-y-auto p-block">
                {isEditing ? (
                  <SubmissionEditForm
                    submission={submission}
                    submissionFormFields={submissionFormFields}
                    onCancel={() => setIsEditing(false)}
                    onSaved={() => {
                      setIsEditing(false)
                      router.refresh()
                    }}
                  />
                ) : (
                  <SubmissionInfoPanel
                    submission={submission}
                    submissionFormFields={submissionFormFields}
                    otherRoles={(
                      otherRoleSubmissions[submission.candidate.id] ?? []
                    ).filter((r) => r.roleId !== submission.roleId)}
                    onNavigateToSubmission={onNavigateToSubmission}
                    onLightboxOpenChange={(open) => {
                      lightboxOpen.current = open
                    }}
                  />
                )}
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
        emailPreview={rejectPreview}
        onConfirm={handleRejectConfirm}
      />

      <EmailPreviewDialog
        open={selectDialogOpen}
        onOpenChange={(open) => {
          if (!open) pendingSelectStageId.current = null
          setSelectDialogOpen(open)
        }}
        initialSubject={selectPreview.subject}
        initialBody={selectPreview.body}
        actionLabel="Select"
        onConfirm={handleSelectConfirm}
      />
    </Sheet>
  )
}
