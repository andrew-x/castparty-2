"use client"

import {
  ArrowRightLeftIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  XCircleIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useEffect, useState } from "react"

const HeadshotLightbox = dynamic(
  () =>
    import("@/components/productions/headshot-lightbox").then(
      (mod) => mod.HeadshotLightbox,
    ),
  { ssr: false },
)

import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/common/popover"
import { Separator } from "@/components/common/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/common/sheet"
import { SocialIcon } from "@/components/common/social-icons"
import { FeedbackPanel } from "@/components/productions/feedback-panel"
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
  feedbackFormFields: CustomForm[]
  onClose: () => void
  onStageChange?: (submission: SubmissionWithCandidate) => void
}

export function SubmissionDetailSheet({
  submission,
  pipelineStages,
  submissionFormFields,
  feedbackFormFields,
  onClose,
  onStageChange,
}: Props) {
  const router = useRouter()

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
  })

  const [stagePopoverOpen, setStagePopoverOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset lightbox when active submission changes
  useEffect(() => {
    setLightboxIndex(null)
  }, [submission?.id])

  function handleStatusChange(stageId: string) {
    if (!submission) return
    executeStatusChange({ submissionId: submission.id, stageId })
    const newStage = pipelineStages.find((s) => s.id === stageId) ?? null
    onStageChange?.({ ...submission, stageId, stage: newStage })
    setStagePopoverOpen(false)
  }

  return (
    <Sheet
      open={!!submission}
      onOpenChange={(open) => {
        if (!open && lightboxIndex === null) onClose()
      }}
    >
      <SheetContent className="sm:max-w-[75vw]" showCloseButton={false}>
        {submission && (
          <>
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
                  <Badge variant="outline" className="text-label">
                    {submission.stage?.name ?? "Inbound"}
                  </Badge>
                  <Popover
                    open={stagePopoverOpen}
                    onOpenChange={setStagePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        leftSection={<ArrowRightLeftIcon />}
                      >
                        Change stage
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-1">
                      <div className="flex flex-col">
                        {pipelineStages
                          .filter((stage) => stage.type !== "REJECTED")
                          .map((stage) => (
                            <button
                              key={stage.id}
                              type="button"
                              disabled={stage.id === submission.stageId}
                              onClick={() => handleStatusChange(stage.id)}
                              className="rounded-sm px-2 py-1.5 text-left text-foreground text-label transition-colors hover:bg-muted disabled:text-muted-foreground disabled:opacity-50"
                            >
                              {stage.name}
                            </button>
                          ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {(() => {
                    const rejectedStage = pipelineStages.find(
                      (s) => s.type === "REJECTED",
                    )
                    if (!rejectedStage) return null
                    const isRejected = submission.stageId === rejectedStage.id
                    return (
                      <Button
                        variant={isRejected ? "destructive" : "outline"}
                        size="sm"
                        leftSection={<XCircleIcon />}
                        onClick={() => {
                          if (!isRejected) {
                            handleStatusChange(rejectedStage.id)
                          }
                        }}
                        disabled={isRejected}
                      >
                        {isRejected ? "Rejected" : "Reject"}
                      </Button>
                    )
                  })()}
                </div>
              </div>
            </SheetHeader>

            <div className="flex min-h-0 flex-1">
              {/* Left pane: submission data */}
              <div className="flex-1 overflow-y-auto p-block">
                <div className="flex flex-col gap-group">
                  {submission.headshots.length > 0 && (
                    <div className="flex flex-col gap-block">
                      <h3 className="font-medium text-foreground text-label">
                        Headshots
                      </h3>
                      <div className="grid grid-cols-3 gap-element">
                        {submission.headshots.map((headshot, i) => (
                          <button
                            key={headshot.id}
                            type="button"
                            onClick={() => setLightboxIndex(i)}
                            className="aspect-square overflow-hidden rounded-lg border border-border"
                          >
                            {/* biome-ignore lint/performance/noImgElement: external R2 URLs */}
                            <img
                              src={headshot.url}
                              alt={headshot.filename}
                              className="size-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                      <HeadshotLightbox
                        open={lightboxIndex !== null}
                        index={lightboxIndex ?? 0}
                        onClose={() => setLightboxIndex(null)}
                        slides={submission.headshots.map((h) => ({
                          src: h.url,
                          alt: h.filename,
                        }))}
                      />
                    </div>
                  )}

                  {submission.resume && (
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
                              <SocialIcon
                                url={link}
                                className="size-4 shrink-0"
                              />
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
                  )}
                </div>
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
    </Sheet>
  )
}
