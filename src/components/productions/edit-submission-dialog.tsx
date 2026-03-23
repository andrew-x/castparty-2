"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { InfoIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Controller } from "react-hook-form"
import { updateSubmission } from "@/actions/submissions/update-submission"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/common/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { LinksEditor } from "@/components/submissions/links-editor"
import { formResolver } from "@/lib/schemas/resolve"
import { updateSubmissionContactFormSchema } from "@/lib/schemas/submission"
import type { SubmissionWithCandidate } from "@/lib/submission-helpers"

interface Props {
  submission: SubmissionWithCandidate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditSubmissionDialog({
  submission,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter()
  const { form, action } = useHookFormAction(
    updateSubmission,
    formResolver(updateSubmissionContactFormSchema),
    {
      formProps: {
        defaultValues: {
          firstName: submission.firstName,
          lastName: submission.lastName,
          email: submission.email,
          phone: submission.phone,
          location: submission.location,
          links: submission.links,
        },
      },
      actionProps: {
        onSuccess() {
          onOpenChange(false)
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ??
              "We couldn't update the submission. Try again.",
          })
        },
      },
    },
  )

  useEffect(() => {
    if (open) {
      form.reset({
        firstName: submission.firstName,
        lastName: submission.lastName,
        email: submission.email,
        phone: submission.phone,
        location: submission.location,
        links: submission.links,
      })
    }
  }, [open, submission, form])

  const { dirtyFields } = form.formState
  const contactDirty =
    dirtyFields.firstName ||
    dirtyFields.lastName ||
    dirtyFields.email ||
    dirtyFields.phone ||
    dirtyFields.location

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit submission</DialogTitle>
          <DialogDescription>
            Update contact information and links for this submission.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) =>
            action.execute({ ...v, submissionId: submission.id }),
          )}
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
                      autoComplete="given-name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                      autoComplete="family-name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
                    autoComplete="email"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                    autoComplete="tel"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                    autoComplete="address-level2"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="links"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Links</FieldLabel>
                  <LinksEditor
                    value={field.value as string[]}
                    onChange={field.onChange}
                  />
                </Field>
              )}
            />
            {contactDirty && (
              <Alert>
                <InfoIcon className="size-4" />
                <AlertDescription>
                  Changes to contact info will update this candidate's profile
                  and all their other submissions.
                </AlertDescription>
              </Alert>
            )}
            {form.formState.errors.root && (
              <Alert variant="destructive">
                <AlertDescription>
                  {form.formState.errors.root.message}
                </AlertDescription>
              </Alert>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={action.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={action.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
