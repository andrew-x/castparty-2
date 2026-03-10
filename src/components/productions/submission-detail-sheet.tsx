"use client"

import { FileTextIcon, MailIcon, MapPinIcon, PhoneIcon } from "lucide-react"
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
import { SocialIcon } from "@/components/common/social-icons"
import day from "@/lib/dayjs"
import { prettifyUrl } from "@/lib/social-links"
import type {
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate | null
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  onClose: () => void
  onStageChange?: (submission: SubmissionWithCandidate) => void
}

export function SubmissionDetailSheet({
  submission,
  pipelineStages,
  submissionFormFields,
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
                  {submission.location && (
                    <div className="flex items-center gap-element text-label">
                      <MapPinIcon className="size-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {submission.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {submission.headshots.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-block">
                    <h3 className="font-medium text-foreground text-label">
                      Headshots
                    </h3>
                    <div className="grid grid-cols-3 gap-element">
                      {submission.headshots.map((headshot) => (
                        <a
                          key={headshot.id}
                          href={headshot.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square overflow-hidden rounded-lg border border-border"
                        >
                          {/* biome-ignore lint/performance/noImgElement: external R2 URLs */}
                          <img
                            src={headshot.url}
                            alt={headshot.filename}
                            className="size-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {submission.resume && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-block">
                    <h3 className="font-medium text-foreground text-label">
                      Resume
                    </h3>
                    <a
                      href={submission.resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-element rounded-lg border border-border px-3 py-2 text-foreground text-label transition-colors hover:bg-muted/50"
                    >
                      <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {submission.resume.filename}
                      </span>
                    </a>
                  </div>
                </>
              )}

              {submission.links.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-col gap-block">
                    <h3 className="font-medium text-foreground text-label">
                      Links
                    </h3>
                    <div className="flex flex-col gap-element">
                      {submission.links.map((link) => (
                        <a
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-element text-label text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <SocialIcon url={link} className="size-4 shrink-0" />
                          <span className="min-w-0 truncate">
                            {prettifyUrl(link)}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

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
                        const field = submissionFormFields.find(
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
