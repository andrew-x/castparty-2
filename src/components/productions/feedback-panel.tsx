"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { MessageSquareIcon } from "lucide-react"
import { useRouter } from "next/navigation"
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
import day from "@/lib/dayjs"
import { feedbackRatingEnum } from "@/lib/db/schema"
import { createFeedbackFormSchema } from "@/lib/schemas/feedback"
import { formResolver } from "@/lib/schemas/resolve"
import type {
  FeedbackData,
  SubmissionWithCandidate,
} from "@/lib/submission-helpers"
import type { CustomForm } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate
  feedbackFormFields: CustomForm[]
}

const RATING_LABELS: Record<FeedbackData["rating"], string> = {
  STRONG_YES: "Strong yes",
  YES: "Yes",
  NO: "No",
  STRONG_NO: "Strong no",
}

const RATING_OPTIONS = feedbackRatingEnum.enumValues

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

export function FeedbackPanel({ submission, feedbackFormFields }: Props) {
  const router = useRouter()

  const { form, action } = useHookFormAction(
    createFeedback,
    formResolver(createFeedbackFormSchema),
    {
      formProps: {
        defaultValues: {
          rating: undefined,
          notes: "",
          answers: {},
        },
      },
      actionProps: {
        onSuccess() {
          form.reset()
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

  return (
    <div className="flex h-full flex-col">
      {/* Feedback list */}
      <div className="flex-1 overflow-y-auto p-block">
        <h3 className="font-medium text-foreground text-label">Feedback</h3>
        {submission.feedback.length === 0 ? (
          <p className="py-4 text-center text-caption text-muted-foreground">
            No feedback yet.
          </p>
        ) : (
          <div className="mt-block flex flex-col gap-group">
            {submission.feedback.map((fb) => (
              <div key={fb.id} className="flex flex-col gap-element">
                <div className="flex items-center gap-element">
                  <Avatar size="sm">
                    {fb.submittedBy.image && (
                      <AvatarImage
                        src={fb.submittedBy.image}
                        alt={fb.submittedBy.name}
                      />
                    )}
                    <AvatarFallback>
                      {getInitials(fb.submittedBy.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-caption text-foreground">
                      {fb.submittedBy.name}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      {day(fb.createdAt).format("LLL")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-element">
                  <Badge {...getRatingBadgeProps(fb.rating)}>
                    {RATING_LABELS[fb.rating]}
                  </Badge>
                  <Badge variant="outline">{fb.stage.name}</Badge>
                </div>
                {fb.notes && (
                  <p className="text-foreground text-label">{fb.notes}</p>
                )}
                {fb.answers.length > 0 && (
                  <div className="flex flex-col gap-element">
                    {fb.answers.map((answer) => {
                      const field = fb.formFields.find(
                        (f) => f.id === answer.fieldId,
                      )
                      if (!field) return null
                      const displayValue = formatAnswerValue(field, answer)
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback form in accordion */}
      <Accordion type="single" collapsible className="border-t">
        <AccordionItem value="add-feedback" className="border-b-0">
          <AccordionTrigger className="px-block py-block text-label">
            <span className="flex items-center gap-element">
              <MessageSquareIcon className="size-4" />
              Add feedback
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form
              onSubmit={form.handleSubmit((values) =>
                action.execute({
                  ...values,
                  submissionId: submission.id,
                  stageId: submission.stageId,
                }),
              )}
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
                />
              ))}

              {form.formState.errors.root && (
                <p className="text-caption text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}

              <Button
                type="submit"
                loading={action.isPending}
                disabled={!form.watch("rating")}
              >
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
}: {
  field: CustomForm
  // biome-ignore lint/suspicious/noExplicitAny: dynamic record paths aren't statically typeable
  register: (name: any) => any
  value: string
  onChange: (value: string) => void
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
          <Input
            {...register(`answers.${field.id}`)}
            required={field.required}
          />
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
          <Textarea
            {...register(`answers.${field.id}`)}
            rows={3}
            required={field.required}
          />
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
        </div>
      )
    case "TOGGLE":
      return (
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
      )
    default:
      return null
  }
}
