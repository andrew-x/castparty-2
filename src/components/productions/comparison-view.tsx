"use client"

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FileTextIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  XIcon,
} from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { updateSubmissionStatus } from "@/actions/submissions/update-submission-status"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/common/dialog"
import { SocialIcon } from "@/components/common/social-icons"
import { StageControls } from "@/components/productions/stage-controls"
import day from "@/lib/dayjs"
import { prettifyUrl } from "@/lib/social-links"
import type {
  FeedbackData,
  PipelineStageData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

const HeadshotLightbox = dynamic(
  () =>
    import("@/components/productions/headshot-lightbox").then(
      (mod) => mod.HeadshotLightbox,
    ),
  { ssr: false },
)

interface ComparisonViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submissions: SubmissionWithCandidate[]
  pipelineStages: PipelineStageData[]
  submissionFormFields: CustomForm[]
  onRemove: (id: string) => void
}

export function ComparisonView({
  open,
  onOpenChange,
  submissions,
  pipelineStages,
  submissionFormFields,
  onRemove,
}: ComparisonViewProps) {
  const router = useRouter()

  // Local state for optimistic stage updates
  const [localSubmissions, setLocalSubmissions] =
    useState<SubmissionWithCandidate[]>(submissions)

  // Sync from parent when submissions change
  const [prevSubmissions, setPrevSubmissions] = useState(submissions)
  if (submissions !== prevSubmissions) {
    setPrevSubmissions(submissions)
    setLocalSubmissions(submissions)
  }

  const { execute: executeStatusChange } = useAction(updateSubmissionStatus, {
    onSuccess() {
      router.refresh()
    },
    onError() {
      setLocalSubmissions(submissions)
      router.refresh()
    },
  })

  function handleStageChange(submissionId: string, stageId: string) {
    const newStage = pipelineStages.find((s) => s.id === stageId) ?? null
    setLocalSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId ? { ...s, stageId, stage: newStage } : s,
      ),
    )
    executeStatusChange({ submissionId, stageId })
  }

  // Lightbox state: which submission + which headshot index
  const [lightbox, setLightbox] = useState<{
    submissionId: string
    index: number
  } | null>(null)

  const lightboxSubmission = lightbox
    ? localSubmissions.find((s) => s.id === lightbox.submissionId)
    : null

  // Track which headshot is shown in the hero per submission
  const [heroIndex, setHeroIndex] = useState<Record<string, number>>({})
  const getHeroIndex = (id: string) => heroIndex[id] ?? 0
  const setHeroFor = (id: string, index: number) =>
    setHeroIndex((prev) => ({ ...prev, [id]: index }))

  const count = localSubmissions.length
  const hasAnyHeadshots = localSubmissions.some((s) => s.headshots.length > 0)
  const hasAnyResume = localSubmissions.some((s) => s.resume)
  const hasAnyLinks = localSubmissions.some((s) => s.links.length > 0)
  const hasAnyUnionStatus = localSubmissions.some(
    (s) => s.unionStatus.length > 0,
  )
  const hasAnyRepresentation = localSubmissions.some(
    (s) => s.representation !== null,
  )
  const hasAnyAnswers = localSubmissions.some((s) => s.answers.length > 0)
  const hasAnyFeedback = localSubmissions.some((s) => s.feedback.length > 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-[95vw] flex-col gap-0 p-0 sm:max-w-[95vw]"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-block py-element">
          <div className="flex items-center gap-element">
            <DialogTitle className="font-semibold text-heading">
              Compare candidates
            </DialogTitle>
            <DialogDescription className="sr-only">
              Side-by-side comparison of selected candidates
            </DialogDescription>
            <Badge variant="secondary">{count}</Badge>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            tooltip="Close"
            onClick={() => onOpenChange(false)}
          >
            <XIcon />
          </Button>
        </div>

        {/* Grid body — each section is a row across all candidates */}
        <div className="flex-1 overflow-auto">
          <div
            className="mx-auto grid w-fit gap-x-block p-block"
            style={{
              gridTemplateColumns: `repeat(${count}, minmax(22rem, 28rem))`,
            }}
          >
            {/* Row: Hero headshot */}
            {localSubmissions.map((s) => {
              const idx = getHeroIndex(s.id)
              const url = s.headshots[idx]?.url
              const hasMultiple = s.headshots.length > 1
              return (
                <div
                  key={s.id}
                  className="group/hero relative aspect-[4/3] overflow-hidden rounded-t-lg bg-black"
                >
                  {url ? (
                    // biome-ignore lint/performance/noImgElement: external R2 URLs
                    <img
                      src={url}
                      alt={`${s.candidate.firstName} ${s.candidate.lastName}`}
                      className="size-full object-contain"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <span className="font-medium text-muted-foreground text-title">
                        {s.candidate.firstName[0]}
                        {s.candidate.lastName[0]}
                      </span>
                    </div>
                  )}
                  {hasMultiple && idx > 0 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      tooltip="Previous photo"
                      onClick={() => setHeroFor(s.id, idx - 1)}
                      className="absolute top-1/2 left-2 -translate-y-1/2 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover/hero:opacity-100"
                    >
                      <ChevronLeftIcon />
                    </Button>
                  )}
                  {hasMultiple && idx < s.headshots.length - 1 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      tooltip="Next photo"
                      onClick={() => setHeroFor(s.id, idx + 1)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 bg-background/80 opacity-0 backdrop-blur-sm transition-opacity group-hover/hero:opacity-100"
                    >
                      <ChevronRightIcon />
                    </Button>
                  )}
                  {count > 2 && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      tooltip="Remove from comparison"
                      onClick={() => onRemove(s.id)}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                    >
                      <XIcon />
                    </Button>
                  )}
                </div>
              )
            })}

            {/* Row: Name + contact */}
            {localSubmissions.map((s) => (
              <div key={s.id} className="flex flex-col gap-element pt-block">
                <h3 className="font-medium text-foreground text-heading">
                  {s.candidate.firstName} {s.candidate.lastName}
                </h3>
                <div className="flex flex-col gap-1 text-label text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MailIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{s.candidate.email}</span>
                  </span>
                  {s.candidate.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="size-3.5 shrink-0" />
                      {s.candidate.phone}
                    </span>
                  )}
                  {s.candidate.location && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="size-3.5 shrink-0" />
                      {s.candidate.location}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Row: Stage controls */}
            {localSubmissions.map((s) => (
              <div key={s.id} className="py-group">
                <StageControls
                  submission={s}
                  pipelineStages={pipelineStages}
                  onStageChange={(stageId) => handleStageChange(s.id, stageId)}
                />
              </div>
            ))}

            {/* Row: Separator */}
            {localSubmissions.map((s) => (
              <div
                key={s.id}
                className="border-border border-b"
                aria-hidden="true"
              />
            ))}

            {/* Row: Headshots gallery */}
            {hasAnyHeadshots &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group">
                  {s.headshots.length > 0 ? (
                    <div className="flex flex-col gap-block">
                      <h4 className="font-medium text-foreground text-label">
                        Headshots
                      </h4>
                      <div className="grid grid-cols-4 gap-element">
                        {s.headshots.map((headshot, i) => (
                          <button
                            key={headshot.id}
                            type="button"
                            onClick={() =>
                              setLightbox({ submissionId: s.id, index: i })
                            }
                            className={`aspect-square overflow-hidden rounded-lg ${i === getHeroIndex(s.id) ? "ring-2 ring-primary ring-offset-1" : "border border-border"}`}
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
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      No headshots
                    </p>
                  )}
                </div>
              ))}

            {/* Row: Resume */}
            {hasAnyResume &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group">
                  <h4 className="mb-block font-medium text-foreground text-label">
                    Resume
                  </h4>
                  {s.resume ? (
                    <a
                      href={s.resume.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-element rounded-lg border border-border px-3 py-2 text-foreground text-label transition-colors hover:bg-muted/50"
                    >
                      <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {s.resume.filename}
                      </span>
                    </a>
                  ) : (
                    <p className="text-caption text-muted-foreground">—</p>
                  )}
                </div>
              ))}

            {/* Row: Links */}
            {hasAnyLinks &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group">
                  <h4 className="mb-block font-medium text-foreground text-label">
                    Links
                  </h4>
                  {s.links.length > 0 ? (
                    <div className="flex flex-col gap-element">
                      {s.links.map((link) => (
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
                  ) : (
                    <p className="text-caption text-muted-foreground">—</p>
                  )}
                </div>
              ))}

            {/* Row: Union affiliations */}
            {hasAnyUnionStatus &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group">
                  <h4 className="mb-block font-medium text-foreground text-label">
                    Union affiliations
                  </h4>
                  {s.unionStatus.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.unionStatus.map((union) => (
                        <Badge key={union} variant="secondary">
                          {union}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground">—</p>
                  )}
                </div>
              ))}

            {/* Row: Representation */}
            {hasAnyRepresentation &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group">
                  <h4 className="mb-block font-medium text-foreground text-label">
                    Representation
                  </h4>
                  {s.representation ? (
                    <div className="flex flex-col gap-element text-label text-muted-foreground">
                      <span>{s.representation.name}</span>
                      <span>{s.representation.email}</span>
                      {s.representation.phone && (
                        <span>{s.representation.phone}</span>
                      )}
                    </div>
                  ) : (
                    <p className="text-caption text-muted-foreground">—</p>
                  )}
                </div>
              ))}

            {/* Row: Submitted date */}
            {localSubmissions.map((s) => (
              <div key={s.id} className="pt-group">
                <h4 className="mb-block font-medium text-foreground text-label">
                  Submitted
                </h4>
                <p className="text-label text-muted-foreground">
                  {day(s.createdAt).format("LLL")}
                </p>
              </div>
            ))}

            {/* Row: Form responses */}
            {hasAnyAnswers &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group">
                  <h4 className="mb-block font-medium text-foreground text-label">
                    Form responses
                  </h4>
                  {s.answers.length > 0 ? (
                    <div className="flex flex-col gap-element">
                      {s.answers.map((answer) => {
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
                  ) : (
                    <p className="text-caption text-muted-foreground">—</p>
                  )}
                </div>
              ))}

            {/* Row: Feedback summary */}
            {hasAnyFeedback &&
              localSubmissions.map((s) => (
                <div key={s.id} className="pt-group pb-block">
                  <h4 className="mb-block font-medium text-foreground text-label">
                    Feedback
                  </h4>
                  {s.feedback.length > 0 ? (
                    <FeedbackSummary feedback={s.feedback} />
                  ) : (
                    <p className="text-caption text-muted-foreground">
                      No feedback
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
        {lightboxSubmission && lightbox && (
          <HeadshotLightbox
            open
            index={lightbox.index}
            onClose={() => setLightbox(null)}
            slides={lightboxSubmission.headshots.map((h) => ({
              src: h.url,
              alt: h.filename,
            }))}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

const RATING_LABELS: Record<FeedbackData["rating"], string> = {
  STRONG_YES: "Strong yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong no",
}

function getRatingBadgeProps(rating: FeedbackData["rating"]) {
  if (rating === "STRONG_YES" || rating === "YES") {
    return {
      variant: "outline" as const,
      className: "border-success-text/30 bg-success-light text-success-text",
    }
  }
  return { variant: "destructive" as const }
}

function FeedbackSummary({ feedback }: { feedback: FeedbackData[] }) {
  const counts: Partial<Record<FeedbackData["rating"], number>> = {}
  for (const fb of feedback) {
    counts[fb.rating] = (counts[fb.rating] ?? 0) + 1
  }

  return (
    <div className="flex flex-wrap gap-1">
      {(Object.entries(counts) as [FeedbackData["rating"], number][]).map(
        ([rating, count]) => (
          <Badge key={rating} {...getRatingBadgeProps(rating)}>
            {count}x {RATING_LABELS[rating]}
          </Badge>
        ),
      )}
    </div>
  )
}
