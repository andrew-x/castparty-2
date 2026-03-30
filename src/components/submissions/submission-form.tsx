"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useState } from "react"
import { Controller } from "react-hook-form"
import { createSubmission } from "@/actions/submissions/create-submission"
import { presignHeadshotUpload } from "@/actions/submissions/presign-headshot-upload"
import { presignResumeUpload } from "@/actions/submissions/presign-resume-upload"
import { Alert, AlertDescription, AlertTitle } from "@/components/common/alert"
import { AutocompleteInput } from "@/components/common/autocomplete-input"
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
import { CustomFieldDisplay } from "@/components/submissions/custom-field-display"
import {
  type HeadshotFile,
  HeadshotUploader,
} from "@/components/submissions/headshot-uploader"
import { LinksEditor } from "@/components/submissions/links-editor"
import { RepresentationFields } from "@/components/submissions/representation-fields"
import { ResumeUploader } from "@/components/submissions/resume-uploader"
import { UnionStatusSelect } from "@/components/submissions/union-status-select"
import { useCityOptions } from "@/hooks/use-city-options"
import { formResolver } from "@/lib/schemas/resolve"
import { submissionFormSchema } from "@/lib/schemas/submission"
import type {
  CustomForm,
  Representation,
  SystemFieldConfig,
  SystemFieldVisibility,
} from "@/lib/types"
import { DEFAULT_SYSTEM_FIELD_CONFIG } from "@/lib/types"

function systemFieldLabel(label: string, visibility: SystemFieldVisibility) {
  if (visibility === "optional") return `${label} (optional)`
  return label
}

function RequiredMarker() {
  return <span className="text-destructive"> *</span>
}

interface AvailableRole {
  id: string
  name: string
  description: string
}

interface Props {
  orgId: string
  productionId: string
  initialRoleId: string
  availableRoles: AvailableRole[]
  orgSlug: string
  productionSlug: string
  submissionFormFields: CustomForm[]
  systemFieldConfig?: SystemFieldConfig
}

export function SubmissionForm({
  orgId,
  productionId,
  initialRoleId,
  availableRoles,
  orgSlug,
  productionSlug,
  submissionFormFields,
  systemFieldConfig = DEFAULT_SYSTEM_FIELD_CONFIG,
}: Props) {
  const cityOptions = useCityOptions()
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([
    initialRoleId,
  ])
  const [roleError, setRoleError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [headshots, setHeadshots] = useState<HeadshotFile[]>([])
  const [resume, setResume] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)

  const defaultAnswers: Record<string, string> = {}
  for (const field of submissionFormFields) {
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
          location: "",
          answers: defaultAnswers,
          links: [],
          unionStatus: [],
          representation: null,
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
    const roleCount = selectedRoleIds.length
    return (
      <div className="flex flex-col gap-group">
        <Alert>
          <AlertTitle>
            {roleCount > 1
              ? `${roleCount} submissions received`
              : "Submission received"}
          </AlertTitle>
          <AlertDescription>
            The production team will review your{" "}
            {roleCount > 1 ? "submissions" : "submission"} and be in touch if
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
        form.clearErrors("root")
        setUploadError(null)
        setResumeError(null)
        setRoleError(null)

        // Validate role selection
        let hasFieldErrors = false
        if (selectedRoleIds.length === 0) {
          setRoleError("Select at least one role.")
          hasFieldErrors = true
        }

        // Validate required custom fields client-side
        for (const formField of submissionFormFields) {
          if (!formField.required) continue
          const value = v.answers[formField.id]
          if (!value?.trim()) {
            form.setError(`answers.${formField.id}`, {
              type: "required",
              message: `${formField.label} is required.`,
            })
            hasFieldErrors = true
          }
        }

        // Validate required system fields client-side
        if (systemFieldConfig.phone === "required" && !v.phone?.trim()) {
          form.setError("phone", {
            type: "required",
            message: "Phone number is required.",
          })
          hasFieldErrors = true
        }
        if (systemFieldConfig.location === "required" && !v.location?.trim()) {
          form.setError("location", {
            type: "required",
            message: "Location is required.",
          })
          hasFieldErrors = true
        }
        if (
          systemFieldConfig.headshots === "required" &&
          headshots.length === 0
        ) {
          setUploadError("At least one headshot is required.")
          hasFieldErrors = true
        }
        if (systemFieldConfig.resume === "required" && !resume) {
          setResumeError("Resume is required.")
          hasFieldErrors = true
        }
        if (hasFieldErrors) return

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

        let resumeMeta:
          | { key: string; filename: string; contentType: string; size: number }
          | undefined

        if (resume) {
          setUploading(true)
          try {
            const presignResult = await presignResumeUpload({
              filename: resume.name,
              contentType: resume.type,
              size: resume.size,
            })

            if (!presignResult?.data) {
              throw new Error(
                presignResult?.serverError ?? "Failed to prepare upload.",
              )
            }

            const { key, presignedUrl } = presignResult.data

            const res = await fetch(presignedUrl, {
              method: "PUT",
              body: resume,
              headers: { "Content-Type": resume.type },
            })
            if (!res.ok) throw new Error("Upload failed.")

            resumeMeta = {
              key,
              filename: resume.name,
              contentType: resume.type,
              size: resume.size,
            }
          } catch (err) {
            setUploading(false)
            setResumeError(
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
          roleIds: selectedRoleIds,
          headshots: headshotMeta,
          resume: resumeMeta,
        })
      })}
    >
      <FieldGroup>
        {availableRoles.length > 1 && (
          <FieldSet
            data-invalid={roleError ? true : undefined}
            className="gap-2"
          >
            <FieldLegend variant="label" className="mb-0">
              Roles
              <RequiredMarker />
            </FieldLegend>
            <FieldDescription className="pt-0.5">
              Select the roles you would like to submit for.
            </FieldDescription>
            <div className="flex max-h-[280px] flex-col gap-1.5 overflow-y-auto">
              {availableRoles.map((role) => {
                const checked = selectedRoleIds.includes(role.id)
                return (
                  <FieldLabel
                    key={role.id}
                    className="flex items-start gap-2 has-data-[state=checked]:bg-transparent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => {
                        setSelectedRoleIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== role.id)
                            : [...prev, role.id],
                        )
                        setRoleError(null)
                      }}
                      className="mt-0.5"
                    />
                    <span className="flex flex-col">
                      <span className="text-label leading-snug">
                        {role.name}
                      </span>
                      {role.description && (
                        <span className="line-clamp-1 text-caption text-muted-foreground">
                          {role.description}
                        </span>
                      )}
                    </span>
                  </FieldLabel>
                )
              })}
            </div>
            {roleError && <FieldError>{roleError}</FieldError>}
          </FieldSet>
        )}

        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>
                First name
                <RequiredMarker />
              </FieldLabel>
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
              <FieldLabel htmlFor={field.name}>
                Last name
                <RequiredMarker />
              </FieldLabel>
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
              <FieldLabel htmlFor={field.name}>
                Email
                <RequiredMarker />
              </FieldLabel>
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

        {systemFieldConfig.phone !== "hidden" && (
          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>
                  {systemFieldLabel("Phone", systemFieldConfig.phone)}
                  {systemFieldConfig.phone === "required" && <RequiredMarker />}
                </FieldLabel>
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
        )}

        {systemFieldConfig.location !== "hidden" && (
          <Controller
            name="location"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={field.name}>
                  {systemFieldLabel("Location", systemFieldConfig.location)}
                  {systemFieldConfig.location === "required" && (
                    <RequiredMarker />
                  )}
                </FieldLabel>
                <AutocompleteInput
                  id={field.name}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={cityOptions}
                  placeholder="e.g. Toronto, ON"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

        {systemFieldConfig.unionStatus !== "hidden" && (
          <Controller
            name="unionStatus"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>
                  {systemFieldLabel(
                    "Union affiliations",
                    systemFieldConfig.unionStatus,
                  )}
                </FieldLabel>
                <FieldDescription>
                  Select your union memberships or type to add unlisted unions.
                </FieldDescription>
                <UnionStatusSelect
                  value={(field.value as string[]) ?? []}
                  onChange={field.onChange}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

        {systemFieldConfig.representation !== "hidden" && (
          <Controller
            name="representation"
            control={form.control}
            render={({ field }) => {
              const repErrors = form.formState.errors.representation as
                | { name?: { message?: string }; email?: { message?: string } }
                | undefined
              return (
                <Field>
                  <FieldLabel>
                    {systemFieldLabel(
                      "Representation",
                      systemFieldConfig.representation,
                    )}
                  </FieldLabel>
                  <RepresentationFields
                    value={field.value as Representation | null}
                    onChange={field.onChange}
                    errors={repErrors}
                  />
                </Field>
              )
            }}
          />
        )}

        {submissionFormFields.map((formField) => (
          <Controller
            key={formField.id}
            name={`answers.${formField.id}`}
            control={form.control}
            render={({ field, fieldState }) => (
              <CustomFieldDisplay
                field={formField}
                value={field.value ?? ""}
                onChange={field.onChange}
                error={fieldState.error}
                id={field.name}
              />
            )}
          />
        ))}

        {systemFieldConfig.headshots !== "hidden" && (
          <Field>
            <FieldLabel>
              {systemFieldLabel("Headshots", systemFieldConfig.headshots)}
              {systemFieldConfig.headshots === "required" && <RequiredMarker />}
            </FieldLabel>
            <HeadshotUploader
              files={headshots}
              onChange={setHeadshots}
              error={uploadError ?? undefined}
            />
          </Field>
        )}

        {systemFieldConfig.resume !== "hidden" && (
          <Field>
            <FieldLabel>
              {systemFieldLabel("Resume", systemFieldConfig.resume)}
              {systemFieldConfig.resume === "required" && <RequiredMarker />}
            </FieldLabel>
            <ResumeUploader
              file={resume}
              onChange={setResume}
              error={resumeError ?? undefined}
            />
          </Field>
        )}

        {systemFieldConfig.links !== "hidden" && (
          <Controller
            name="links"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>
                  {systemFieldLabel("Links", systemFieldConfig.links)}
                </FieldLabel>
                <FieldDescription>
                  Add links to your portfolio, social media, or demo reels.
                </FieldDescription>
                <LinksEditor
                  value={(field.value as string[]) ?? []}
                  onChange={field.onChange}
                />
                {fieldState.error && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}

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
          {uploading
            ? "Uploading files..."
            : selectedRoleIds.length > 1
              ? `Submit for ${selectedRoleIds.length} roles`
              : "Submit"}
        </Button>
      </FieldGroup>
    </form>
  )
}
