"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useState } from "react"
import { Controller } from "react-hook-form"
import { createSubmission } from "@/actions/submissions/create-submission"
import { presignHeadshotUpload } from "@/actions/submissions/presign-headshot-upload"
import { Alert, AlertDescription, AlertTitle } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import { Checkbox } from "@/components/common/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
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
  HeadshotUploader,
  type HeadshotFile,
} from "@/components/submissions/headshot-uploader"
import { formResolver } from "@/lib/schemas/resolve"
import { submissionFormSchema } from "@/lib/schemas/submission"
import type { CustomForm } from "@/lib/types"

interface Props {
  orgId: string
  productionId: string
  roleId: string
  orgSlug: string
  productionSlug: string
  formFields: CustomForm[]
}

export function SubmissionForm({
  orgId,
  productionId,
  roleId,
  orgSlug,
  productionSlug,
  formFields,
}: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [headshots, setHeadshots] = useState<HeadshotFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const defaultAnswers: Record<string, string> = {}
  for (const field of formFields) {
    defaultAnswers[field.id] = field.type === "TOGGLE" ? "false" : ""
  }

  const { form, action } = useHookFormAction(
    createSubmission,
    formResolver(submissionFormSchema),
    {
      formProps: {
        defaultValues: {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          answers: defaultAnswers,
        },
      },
      actionProps: {
        onSuccess() {
          setSubmitted(true)
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ??
              "We couldn't submit your audition. Try again.",
          })
        },
      },
    },
  )

  if (submitted) {
    return (
      <div className="flex flex-col gap-group">
        <Alert>
          <AlertTitle>Submission received</AlertTitle>
          <AlertDescription>
            The production team will review your submission and be in touch if
            they want to move forward.
          </AlertDescription>
        </Alert>
        <Button
          href={`/s/${orgSlug}/${productionSlug}`}
          variant="outline"
          className="w-fit"
        >
          Browse other roles
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        setUploadError(null)

        let headshotMeta: {
          key: string
          filename: string
          contentType: string
          size: number
        }[] = []

        if (headshots.length > 0) {
          setUploading(true)
          try {
            // 1. Request presigned URLs via server action
            const presignResult = await presignHeadshotUpload({
              files: headshots.map((h) => ({
                filename: h.file.name,
                contentType: h.file.type,
                size: h.file.size,
              })),
            })

            if (!presignResult?.data?.files) {
              throw new Error(
                presignResult?.serverError ?? "Failed to prepare upload.",
              )
            }

            const presigned = presignResult.data.files

            // 2. Upload all files to R2 in parallel
            await Promise.all(
              presigned.map(async ({ presignedUrl }, i) => {
                const res = await fetch(presignedUrl, {
                  method: "PUT",
                  body: headshots[i].file,
                  headers: { "Content-Type": headshots[i].file.type },
                })
                if (!res.ok) throw new Error("Upload failed.")
              }),
            )

            // 3. Build metadata for server action
            headshotMeta = presigned.map(({ key }, i) => ({
              key,
              filename: headshots[i].file.name,
              contentType: headshots[i].file.type,
              size: headshots[i].file.size,
            }))
          } catch (err) {
            setUploading(false)
            setUploadError(
              err instanceof Error ? err.message : "Upload failed. Try again.",
            )
            return
          }
          setUploading(false)
        }

        action.execute({
          ...v,
          orgId,
          productionId,
          roleId,
          headshots: headshotMeta,
        })
      })}
    >
      <FieldGroup>
        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>First name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="text"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="phone"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="tel"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {formFields.map((formField) => {
          switch (formField.type) {
            case "TEXT":
              return (
                <Controller
                  key={formField.id}
                  name={`answers.${formField.id}`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>
                        {formField.label}
                      </FieldLabel>
                      {formField.description && (
                        <FieldDescription>
                          {formField.description}
                        </FieldDescription>
                      )}
                      <Input
                        {...field}
                        id={field.name}
                        type="text"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )
            case "TEXTAREA":
              return (
                <Controller
                  key={formField.id}
                  name={`answers.${formField.id}`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>
                        {formField.label}
                      </FieldLabel>
                      {formField.description && (
                        <FieldDescription>
                          {formField.description}
                        </FieldDescription>
                      )}
                      <Textarea
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )
            case "SELECT":
              return (
                <Controller
                  key={formField.id}
                  name={`answers.${formField.id}`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel htmlFor={field.name}>
                        {formField.label}
                      </FieldLabel>
                      {formField.description && (
                        <FieldDescription>
                          {formField.description}
                        </FieldDescription>
                      )}
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id={field.name}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                          {formField.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )
            case "CHECKBOX_GROUP":
              return (
                <Controller
                  key={formField.id}
                  name={`answers.${formField.id}`}
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const selected = field.value ? field.value.split(",") : []
                    function toggle(option: string) {
                      const next = selected.includes(option)
                        ? selected.filter((s) => s !== option)
                        : [...selected, option]
                      field.onChange(next.join(","))
                    }
                    return (
                      <FieldSet data-invalid={fieldState.invalid || undefined}>
                        <FieldLegend variant="label">
                          {formField.label}
                        </FieldLegend>
                        {formField.description && (
                          <FieldDescription>
                            {formField.description}
                          </FieldDescription>
                        )}
                        <div className="flex flex-col gap-element">
                          {formField.options.map((option) => (
                            <FieldLabel
                              key={option}
                              className="flex items-center gap-2 text-label"
                            >
                              <Checkbox
                                checked={selected.includes(option)}
                                onCheckedChange={() => toggle(option)}
                              />
                              {option}
                            </FieldLabel>
                          ))}
                        </div>
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </FieldSet>
                    )
                  }}
                />
              )
            case "TOGGLE":
              return (
                <Controller
                  key={formField.id}
                  name={`answers.${formField.id}`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="horizontal"
                      data-invalid={fieldState.invalid || undefined}
                    >
                      <div className="flex flex-col gap-1">
                        <FieldLabel htmlFor={field.name}>
                          {formField.label}
                        </FieldLabel>
                        {formField.description && (
                          <FieldDescription>
                            {formField.description}
                          </FieldDescription>
                        )}
                      </div>
                      <Switch
                        id={field.name}
                        checked={field.value === "true"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "true" : "false")
                        }
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )
            default:
              return null
          }
        })}
        <Field>
          <FieldLabel>Headshots</FieldLabel>
          <HeadshotUploader
            files={headshots}
            onChange={setHeadshots}
            error={uploadError ?? undefined}
          />
        </Field>
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          loading={uploading || action.isPending}
          className="w-fit"
        >
          {uploading ? "Uploading headshots..." : "Submit audition"}
        </Button>
      </FieldGroup>
    </form>
  )
}
