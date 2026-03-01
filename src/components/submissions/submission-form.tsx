"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { createSubmission } from "@/actions/submissions/create-submission"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"

const submissionSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required.").max(100),
  lastName: z.string().trim().min(1, "Last name is required.").max(100),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
})

type FormValues = z.infer<typeof submissionSchema>

interface Props {
  orgId: string
  productionId: string
  roleId: string
}

export function SubmissionForm({ orgId, productionId, roleId }: Props) {
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(submissionSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "" },
  })

  const { execute, isPending } = useAction(createSubmission, {
    onSuccess() {
      setSubmitted(true)
    },
    onError({ error }) {
      form.setError("root", {
        message:
          error.serverError ?? "We couldn't submit your audition. Try again.",
      })
    },
  })

  if (submitted) {
    return (
      <Alert>
        <AlertDescription>
          Your submission has been received. Good luck!
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit((v) =>
        execute({ ...v, orgId, productionId, roleId }),
      )}
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
              <FieldLabel htmlFor={field.name}>Phone (optional)</FieldLabel>
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
        {form.formState.errors.root && (
          <Alert variant="destructive">
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit" loading={isPending}>
          Submit audition
        </Button>
      </FieldGroup>
    </form>
  )
}
