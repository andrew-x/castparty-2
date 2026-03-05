"use client"

import { MailIcon, PhoneIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { Separator } from "@/components/common/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/common/sheet"
import day from "@/lib/dayjs"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate | null
  pipelineStages: PipelineStageData[]
  formFields: CustomForm[]
  onClose: () => void
  onStageChange?: (submission: SubmissionWithCandidate) => void
}

export function SubmissionDetailSheet({
  submission,
  pipelineStages,
  formFields,
  onClose,
  onStageChange,
}: Props) {
  const router = useRouter()

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
  })

  function handleStatusChange(stageId: string) {
    if (!submission) return
    executeStatusChange({ submissionId: submission.id, stageId })
    const newStage = pipelineStages.find((s) => s.id === stageId) ?? null
    onStageChange?.({ ...submission, stageId, stage: newStage })
  }

  return (
    <Sheet
      open={!!submission}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent>
        {submission && (
          <>
            <SheetHeader>
              <SheetTitle>
                {submission.firstName} {submission.lastName}
              </SheetTitle>
              <SheetDescription>Submission details</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-group px-4">
              <div className="flex flex-col gap-block">
                <h3 className="font-medium text-foreground text-label">
                  Status
                </h3>
                <Select
                  value={submission.stageId}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex flex-col gap-block">
                <h3 className="font-medium text-foreground text-label">
                  Contact
                </h3>
                <div className="flex flex-col gap-element">
                  <div className="flex items-center gap-element text-label">
                    <MailIcon className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {submission.email}
                    </span>
                  </div>
                  {submission.phone && (
                    <div className="flex items-center gap-element text-label">
                      <PhoneIcon className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {submission.phone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-block">
                <h3 className="font-medium text-foreground text-label">
                  Submitted
                </h3>
                <p className="text-label text-muted-foreground">
                  {day(submission.createdAt).format("LLL")}
                </p>
              </div>

              {submission.answers.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-block">
                    <h3 className="font-medium text-foreground text-label">
                      Form responses
                    </h3>
                    <div className="flex flex-col gap-element">
                      {submission.answers.map((answer) => {
                        const field = formFields.find(
                          (f) => f.id === answer.fieldId,
                        )
                        if (!field) return null

                        let displayValue: string
                        if (
                          field.type === "TEXT" ||
                          field.type === "TEXTAREA"
                        ) {
                          displayValue = answer.textValue ?? ""
                        } else if (field.type === "SELECT") {
                          displayValue = answer.optionValues?.[0] ?? ""
                        } else if (field.type === "CHECKBOX_GROUP") {
                          displayValue = answer.optionValues?.join(", ") ?? ""
                        } else {
                          displayValue = answer.booleanValue ? "Yes" : "No"
                        }

                        if (!displayValue) return null

                        return (
                          <div key={answer.fieldId}>
                            <p className="font-medium text-caption text-muted-foreground">
                              {field.label}
                            </p>
                            <p className="text-foreground text-label">
                              {displayValue}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
