"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { FileTextIcon } from "lucide-react"
import { useState } from "react"
import { Controller } from "react-hook-form"
import { presignHeadshotUpload } from "@/actions/submissions/presign-headshot-upload"
import { presignResumeUpload } from "@/actions/submissions/presign-resume-upload"
import { updateSubmission } from "@/actions/submissions/update-submission"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { Separator } from "@/components/common/separator"
import {
  type HeadshotFile,
  HeadshotUploader,
} from "@/components/submissions/headshot-uploader"
import { LinksEditor } from "@/components/submissions/links-editor"
import { RepresentationFields } from "@/components/submissions/representation-fields"
import { ResumeUploader } from "@/components/submissions/resume-uploader"
import { UnionStatusSelect } from "@/components/submissions/union-status-select"
import { VideoEmbed } from "@/components/submissions/video-embed"
import { formResolver } from "@/lib/schemas/resolve"
import { updateSubmissionFormSchema } from "@/lib/schemas/submission"
import type { SubmissionWithCandidate } from "@/lib/submission-helpers"
import type { CustomForm, Representation } from "@/lib/types"

interface Props {
  submission: SubmissionWithCandidate
  submissionFormFields: CustomForm[]
  onCancel: () => void
  onSaved: () => void
}

export function SubmissionEditForm({
  submission,
  submissionFormFields,
  onCancel,
  onSaved,
}: Props) {
  const [newHeadshots, setNewHeadshots] = useState<HeadshotFile[]>([])
  const [newResume, setNewResume] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { form, action } = useHookFormAction(
    updateSubmission,
    formResolver(updateSubmissionFormSchema),
    {
      formProps: {
        defaultValues: {
          firstName: submission.candidate.firstName,
          lastName: submission.candidate.lastName,
          email: submission.candidate.email,
          phone: submission.candidate.phone ?? "",
          location: submission.candidate.location ?? "",
          links: submission.links,
          videoUrl: submission.videoUrl ?? "",
          unionStatus: submission.unionStatus ?? [],
          representation: submission.representation ?? null,
        },
      },
      actionProps: {
        onSuccess() {
          onSaved()
        },
        onError({ error }) {
          form.setError("root", {
            message: error.serverError ?? "Something went wrong. Try again.",
          })
        },
      },
    },
  )

  const maxNewHeadshots = 10 - submission.headshots.length

  return (
    <form
      onSubmit={form.handleSubmit(async (v) => {
        form.clearErrors("root")
        setUploadError(null)

        let headshotMeta: {
          key: string
          filename: string
          contentType: string
          size: number
        }[] = []

        // Upload new headshots
        if (newHeadshots.length > 0) {
          setUploading(true)
          try {
            const presignResult = await presignHeadshotUpload({
              files: newHeadshots.map((h) => ({
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

            await Promise.all(
              presigned.map(async ({ presignedUrl }, i) => {
                const res = await fetch(presignedUrl, {
                  method: "PUT",
                  body: newHeadshots[i].file,
                  headers: { "Content-Type": newHeadshots[i].file.type },
                })
                if (!res.ok) throw new Error("Upload failed.")
              }),
            )

            headshotMeta = presigned.map(({ key }, i) => ({
              key,
              filename: newHeadshots[i].file.name,
              contentType: newHeadshots[i].file.type,
              size: newHeadshots[i].file.size,
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

        // Upload new resume
        let resumeMeta:
          | {
              key: string
              filename: string
              contentType: string
              size: number
            }
          | undefined

        if (newResume) {
          setUploading(true)
          try {
            const presignResult = await presignResumeUpload({
              filename: newResume.name,
              contentType: newResume.type,
              size: newResume.size,
            })

            if (!presignResult?.data) {
              throw new Error(
                presignResult?.serverError ?? "Failed to prepare upload.",
              )
            }

            const { key, presignedUrl } = presignResult.data

            const res = await fetch(presignedUrl, {
              method: "PUT",
              body: newResume,
              headers: { "Content-Type": newResume.type },
            })
            if (!res.ok) throw new Error("Upload failed.")

            resumeMeta = {
              key,
              filename: newResume.name,
              contentType: newResume.type,
              size: newResume.size,
            }
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
          submissionId: submission.id,
          newHeadshots: headshotMeta,
          newResume: resumeMeta,
        })
      })}
    >
      <FieldGroup>
        <div className="grid grid-cols-2 gap-element">
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
        </div>

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

        <Controller
          name="location"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>Location</FieldLabel>
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
          name="links"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Links</FieldLabel>
              <LinksEditor
                value={(field.value as string[]) ?? []}
                onChange={field.onChange}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="videoUrl"
          control={form.control}
          render={({ field, fieldState }) => {
            const url = (field.value as string) ?? ""
            return (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>Video</FieldLabel>
                <Input
                  id={field.name}
                  type="url"
                  value={url}
                  onChange={(e) => field.onChange(e.target.value)}
                  onBlur={() => {
                    if (
                      url &&
                      !url.startsWith("http://") &&
                      !url.startsWith("https://")
                    ) {
                      field.onChange(`https://${url}`)
                    }
                  }}
                  placeholder="https://..."
                  aria-invalid={fieldState.invalid}
                />
                {url && <VideoEmbed url={url} />}
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )
          }}
        />

        <Controller
          name="unionStatus"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Union affiliations</FieldLabel>
              <UnionStatusSelect
                value={(field.value as string[]) ?? []}
                onChange={field.onChange}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="representation"
          control={form.control}
          render={({ field }) => {
            const repErrors = form.formState.errors.representation as
              | { name?: { message?: string }; email?: { message?: string } }
              | undefined
            return (
              <Field>
                <FieldLabel>Representation</FieldLabel>
                <RepresentationFields
                  value={field.value as Representation | null}
                  onChange={field.onChange}
                  errors={repErrors}
                />
              </Field>
            )
          }}
        />

        <FieldSeparator />

        {/* Existing headshots (read-only) + add new */}
        <Field>
          <FieldLabel>Headshots</FieldLabel>
          {submission.headshots.length > 0 && (
            <div className="grid grid-cols-3 gap-element">
              {submission.headshots.map((headshot) => (
                <div
                  key={headshot.id}
                  className="aspect-square overflow-hidden rounded-lg border border-border"
                >
                  {/* biome-ignore lint/performance/noImgElement: external R2 URLs */}
                  <img
                    src={headshot.url}
                    alt={headshot.filename}
                    className="size-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
          {maxNewHeadshots > 0 && (
            <HeadshotUploader
              files={newHeadshots}
              onChange={setNewHeadshots}
              maxFiles={maxNewHeadshots}
              error={uploadError ?? undefined}
            />
          )}
        </Field>

        {/* Resume: read-only if exists, upload if not */}
        <Field>
          <FieldLabel>Resume</FieldLabel>
          {submission.resume ? (
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
          ) : (
            <ResumeUploader file={newResume} onChange={setNewResume} />
          )}
        </Field>

        {/* Form responses (read-only) */}
        {submissionFormFields.length > 0 && (
          <>
            <FieldSeparator />
            <div className="flex flex-col gap-block">
              <h3 className="font-medium text-foreground text-label">
                Form responses
              </h3>
              <div className="flex flex-col gap-element">
                {submissionFormFields.map((field) => {
                  const answer = submission.answers.find(
                    (a) => a.fieldId === field.id,
                  )

                  if (field.type === "VIDEO") {
                    const url = answer?.textValue
                    return (
                      <div key={field.id}>
                        <p className="font-medium text-caption text-muted-foreground">
                          {field.label}
                        </p>
                        {url ? (
                          <VideoEmbed url={url} size="sm" showHint />
                        ) : (
                          <p className="text-label text-muted-foreground italic">
                            Not provided
                          </p>
                        )}
                      </div>
                    )
                  }

                  let displayValue = ""
                  if (answer) {
                    if (field.type === "TEXT" || field.type === "TEXTAREA") {
                      displayValue = answer.textValue ?? ""
                    } else if (field.type === "SELECT") {
                      displayValue = answer.optionValues?.[0] ?? ""
                    } else if (field.type === "CHECKBOX_GROUP") {
                      displayValue = answer.optionValues?.join(", ") ?? ""
                    } else {
                      displayValue = answer.booleanValue ? "Yes" : "No"
                    }
                  }

                  return (
                    <div key={field.id}>
                      <p className="font-medium text-caption text-muted-foreground">
                        {field.label}
                      </p>
                      {displayValue ? (
                        <p className="text-foreground text-label">
                          {displayValue}
                        </p>
                      ) : (
                        <p className="text-label text-muted-foreground italic">
                          Not answered
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="flex items-center gap-element">
          <Button
            type="submit"
            size="sm"
            loading={uploading || action.isPending}
          >
            {uploading ? "Uploading files..." : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={uploading || action.isPending}
          >
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  )
}
