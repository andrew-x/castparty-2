"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import {
  ArrowRightIcon,
  InboxIcon,
  MessageCircleIcon,
  MessageSquareIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { createComment } from "@/actions/comments/create-comment"
import { createFeedback } from "@/actions/feedback/create-feedback"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/common/accordion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/avatar"
import { Badge } from "@/components/common/badge"
import { Button } from "@/components/common/button"
import { Checkbox } from "@/components/common/checkbox"
import { Input } from "@/components/common/input"
import { Label } from "@/components/common/label"
import { RadioGroup, RadioGroupItem } from "@/components/common/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/select"
import { Switch } from "@/components/common/switch"
import { Textarea } from "@/components/common/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/tooltip"
import day from "@/lib/dayjs"
import { createCommentFormSchema } from "@/lib/schemas/comment"
import { createFeedbackFormSchema } from "@/lib/schemas/feedback"
import { formResolver } from "@/lib/schemas/resolve"
import type {
  CommentData,
  FeedbackData,
  StageChangeData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import { buildActivityList } from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate
  feedbackFormFields: CustomForm[]
}

const RATING_LABELS: Record<FeedbackData["rating"], string> = {
  STRONG_YES: "4 — Strong yes",
  YES: "3 — Yes",
  NO: "2 — No",
  STRONG_NO: "1 — Strong no",
}

const RATING_OPTIONS: FeedbackData["rating"][] = [
  "STRONG_YES",
  "YES",
  "NO",
  "STRONG_NO",
]

function getRatingBadgeProps(rating: FeedbackData["rating"]) {
  if (rating === "STRONG_YES" || rating === "YES") {
    return {
      variant: "outline" as const,
      className: "border-success-text/30 bg-success-light text-success-text",
    }
  }
  return { variant: "destructive" as const }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatAnswerValue(
  field: CustomForm,
  answer: {
    textValue: string | null
    booleanValue: boolean | null
    optionValues: string[] | null
  },
) {
  switch (field.type) {
    case "TEXT":
    case "TEXTAREA":
      return answer.textValue ?? ""
    case "SELECT":
      return answer.optionValues?.[0] ?? ""
    case "CHECKBOX_GROUP":
      return answer.optionValues?.join(", ") ?? ""
    case "TOGGLE":
      return answer.booleanValue ? "Yes" : "No"
    default:
      return answer.textValue ?? ""
  }
}

function FeedbackItem({ feedback: fb }: { feedback: FeedbackData }) {
  return (
    <div className="flex flex-col gap-block rounded-md border border-l-4 border-l-primary/40 bg-muted/30 p-block">
      <div className="flex items-center gap-element">
        <Avatar size="sm">
          {fb.submittedBy.image && (
            <AvatarImage src={fb.submittedBy.image} alt={fb.submittedBy.name} />
          )}
          <AvatarFallback>{getInitials(fb.submittedBy.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-caption text-foreground">
            {fb.submittedBy.name}
          </p>
          <p className="text-caption text-muted-foreground">
            {day(fb.createdAt).format("LLL")}
          </p>
        </div>
        <div className="flex items-center gap-element">
          <Badge {...getRatingBadgeProps(fb.rating)}>
            {RATING_LABELS[fb.rating]}
          </Badge>
          <Badge variant="outline">{fb.stage.name}</Badge>
        </div>
      </div>
      {fb.notes && <p className="text-foreground text-label">{fb.notes}</p>}
      {fb.answers.length > 0 && (
        <div className="flex flex-col gap-element">
          {fb.answers.map((answer) => {
            const field = fb.formFields.find((f) => f.id === answer.fieldId)
            if (!field) return null
            const displayValue = formatAnswerValue(field, answer)
            if (!displayValue) return null
            return (
              <div key={answer.fieldId}>
                <p className="font-medium text-caption text-muted-foreground">
                  {field.label}
                </p>
                <p className="text-foreground text-label">{displayValue}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CommentItem({ comment }: { comment: CommentData }) {
  return (
    <div className="flex flex-col gap-element rounded-md border p-block">
      <div className="flex items-center gap-element">
        <Avatar size="sm">
          {comment.submittedBy.image && (
            <AvatarImage
              src={comment.submittedBy.image}
              alt={comment.submittedBy.name}
            />
          )}
          <AvatarFallback>
            {getInitials(comment.submittedBy.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-caption text-foreground">
            {comment.submittedBy.name}
          </p>
          <p className="text-caption text-muted-foreground">
            {day(comment.createdAt).format("LLL")}
          </p>
        </div>
        <MessageCircleIcon className="size-3.5 text-muted-foreground" />
      </div>
      <p className="text-foreground text-label">{comment.content}</p>
    </div>
  )
}

function StageChangeItem({ stageChange }: { stageChange: StageChangeData }) {
  const label = stageChange.fromStageName
    ? `${stageChange.fromStageName} → ${stageChange.toStageName ?? "Unknown"}`
    : `Moved to ${stageChange.toStageName ?? "Unknown"}`
  const fullText = stageChange.changedBy
    ? `${label} by ${stageChange.changedBy.name}`
    : label

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-element py-1 text-caption text-muted-foreground">
          <ArrowRightIcon className="size-3 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{fullText}</span>
          <span className="shrink-0">
            {day(stageChange.createdAt).format("LLL")}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="top">{fullText}</TooltipContent>
    </Tooltip>
  )
}

function SubmittedItem({ createdAt }: { createdAt: Date | string }) {
  return (
    <div className="flex items-center gap-element py-1 text-caption text-muted-foreground">
      <InboxIcon className="size-3 shrink-0" />
      <span className="min-w-0 flex-1">Submission created</span>
      <span className="shrink-0">{day(createdAt).format("LLL")}</span>
    </div>
  )
}

export function FeedbackPanel({ submission, feedbackFormFields }: Props) {
  const router = useRouter()

  // Feedback form setup
  const defaultAnswers: Record<string, string> = {}
  for (const field of feedbackFormFields) {
    defaultAnswers[field.id] = field.type === "TOGGLE" ? "false" : ""
  }

  const feedbackDefaultValues = {
    rating: undefined as FeedbackData["rating"] | undefined,
    notes: "",
    answers: defaultAnswers,
  }

  const { form, action } = useHookFormAction(
    createFeedback,
    formResolver(createFeedbackFormSchema),
    {
      formProps: { defaultValues: feedbackDefaultValues },
      actionProps: {
        onSuccess() {
          form.reset(feedbackDefaultValues)
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message: error.serverError ?? "Something went wrong. Try again.",
          })
        },
      },
    },
  )

  // Comment form setup
  const commentDefaultValues = { content: "" }

  const { form: commentForm, action: commentAction } = useHookFormAction(
    createComment,
    formResolver(createCommentFormSchema),
    {
      formProps: { defaultValues: commentDefaultValues },
      actionProps: {
        onSuccess() {
          commentForm.reset(commentDefaultValues)
          router.refresh()
        },
        onError({ error }) {
          commentForm.setError("root", {
            message: error.serverError ?? "Something went wrong. Try again.",
          })
        },
      },
    },
  )

  const activityItems = buildActivityList(submission)

  return (
    <div className="flex h-full flex-col">
      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-block">
        <h3 className="font-medium text-foreground text-label">Activity</h3>
        {activityItems.length === 0 ? (
          <p className="py-4 text-center text-caption text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          <div className="mt-block flex flex-col gap-block">
            {activityItems.map((item) => {
              switch (item.type) {
                case "feedback":
                  return (
                    <FeedbackItem key={item.data.id} feedback={item.data} />
                  )
                case "comment":
                  return <CommentItem key={item.data.id} comment={item.data} />
                case "stage_change":
                  return (
                    <StageChangeItem
                      key={item.data.id}
                      stageChange={item.data}
                    />
                  )
                case "submitted":
                  return (
                    <SubmittedItem
                      key="submitted"
                      createdAt={item.data.createdAt}
                    />
                  )
              }
            })}
          </div>
        )}
      </div>

      {/* Comment + Feedback form accordions (mutually exclusive) */}
      <Accordion type="single" collapsible className="border-t-2">
        <AccordionItem value="add-comment" className="border-b-0">
          <AccordionTrigger className="px-block py-block text-label [&>svg]:rotate-180 [&[data-state=open]>svg]:rotate-0">
            <span className="flex items-center gap-element">
              <MessageCircleIcon className="size-4" />
              Add comment
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form
              onSubmit={commentForm.handleSubmit((values) => {
                commentForm.clearErrors("root")
                commentAction.execute({
                  ...values,
                  submissionId: submission.id,
                })
              })}
              className="flex flex-col gap-block px-block pb-block"
            >
              <Textarea
                placeholder="Write a comment..."
                rows={3}
                {...commentForm.register("content")}
              />
              {commentForm.formState.errors.content && (
                <p className="text-caption text-destructive">
                  {commentForm.formState.errors.content.message}
                </p>
              )}
              {commentForm.formState.errors.root && (
                <p className="text-caption text-destructive">
                  {commentForm.formState.errors.root.message}
                </p>
              )}
              <Button type="submit" loading={commentAction.isPending}>
                Post comment
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="add-feedback" className="border-b-0 border-t">
          <AccordionTrigger className="px-block py-block text-label [&>svg]:rotate-180 [&[data-state=open]>svg]:rotate-0">
            <span className="flex items-center gap-element">
              <MessageSquareIcon className="size-4" />
              Add feedback
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form
              onSubmit={form.handleSubmit((values) => {
                form.clearErrors("root")

                // Validate required custom fields client-side
                let hasFieldErrors = false
                for (const formField of feedbackFormFields) {
                  if (!formField.required) continue
                  const value = values.answers[formField.id]
                  if (!value || !value.trim()) {
                    form.setError(`answers.${formField.id}`, {
                      type: "required",
                      message: `${formField.label} is required.`,
                    })
                    hasFieldErrors = true
                  }
                }
                if (hasFieldErrors) return

                action.execute({
                  ...values,
                  submissionId: submission.id,
                  stageId: submission.stageId,
                })
              })}
              className="flex max-h-[50vh] flex-col gap-block overflow-y-auto px-block pb-block"
            >
              {/* Rating */}
              <div className="flex flex-col gap-element">
                <Label>Rating</Label>
                <RadioGroup
                  value={form.watch("rating") ?? ""}
                  onValueChange={(value) => {
                    form.setValue("rating", value as FeedbackData["rating"], {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }}
                  className="flex flex-col gap-element"
                >
                  {RATING_OPTIONS.map((option) => (
                    <Label
                      key={option}
                      className="flex items-center gap-element font-normal text-label"
                    >
                      <RadioGroupItem value={option} />
                      {RATING_LABELS[option]}
                    </Label>
                  ))}
                </RadioGroup>
                {form.formState.errors.rating && (
                  <p className="text-caption text-destructive">
                    {form.formState.errors.rating.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-element">
                <Label htmlFor="feedback-notes">Notes</Label>
                <Textarea
                  id="feedback-notes"
                  placeholder="Add your notes..."
                  rows={3}
                  {...form.register("notes")}
                />
              </div>

              {/* Custom form fields */}
              {feedbackFormFields.map((field) => (
                <CustomFormField
                  key={field.id}
                  field={field}
                  register={form.register}
                  value={form.watch(`answers.${field.id}`) ?? ""}
                  onChange={(value) =>
                    form.setValue(`answers.${field.id}`, value, {
                      shouldDirty: true,
                    })
                  }
                  error={
                    form.formState.errors.answers?.[field.id]?.message as
                      | string
                      | undefined
                  }
                />
              ))}

              {form.formState.errors.root && (
                <p className="text-caption text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button type="submit" loading={action.isPending}>
                Submit feedback
              </Button>
            </form>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function CustomFormField({
  field,
  register,
  value,
  onChange,
  error,
}: {
  field: CustomForm
  // biome-ignore lint/suspicious/noExplicitAny: dynamic record paths aren't statically typeable
  register: (name: any) => any
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  switch (field.type) {
    case "TEXT":
      return (
        <div className="flex flex-col gap-element">
          <Label>{field.label}</Label>
          {field.description && (
            <p className="text-caption text-muted-foreground">
              {field.description}
            </p>
          )}
          <Input {...register(`answers.${field.id}`)} />
          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
      )
    case "TEXTAREA":
      return (
        <div className="flex flex-col gap-element">
          <Label>{field.label}</Label>
          {field.description && (
            <p className="text-caption text-muted-foreground">
              {field.description}
            </p>
          )}
          <Textarea {...register(`answers.${field.id}`)} rows={3} />
          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
      )
    case "SELECT":
      return (
        <div className="flex flex-col gap-element">
          <Label>{field.label}</Label>
          {field.description && (
            <p className="text-caption text-muted-foreground">
              {field.description}
            </p>
          )}
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
      )
    case "CHECKBOX_GROUP":
      return (
        <div className="flex flex-col gap-element">
          <Label>{field.label}</Label>
          {field.description && (
            <p className="text-caption text-muted-foreground">
              {field.description}
            </p>
          )}
          <div className="flex flex-col gap-element">
            {field.options.map((option) => {
              const selected = value ? value.split(",") : []
              const isChecked = selected.includes(option)
              return (
                <Label
                  key={option}
                  className="flex items-center gap-element font-normal text-label"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => {
                      const next = isChecked
                        ? selected.filter((s) => s !== option)
                        : [...selected, option]
                      onChange(next.join(","))
                    }}
                  />
                  {option}
                </Label>
              )
            })}
          </div>
          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
      )
    case "TOGGLE":
      return (
        <div className="flex flex-col gap-element">
          <div className="flex items-center justify-between gap-element">
            <div>
              <Label>{field.label}</Label>
              {field.description && (
                <p className="text-caption text-muted-foreground">
                  {field.description}
                </p>
              )}
            </div>
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => onChange(String(checked))}
            />
          </div>
          {error && <p className="text-caption text-destructive">{error}</p>}
        </div>
      )
    default:
      return null
  }
}
