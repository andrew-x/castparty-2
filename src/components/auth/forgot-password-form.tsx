"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address."),
})

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  async function onSubmit(_values: z.infer<typeof forgotPasswordSchema>) {
    // TODO: replace with authClient.forgetPassword.email() when email is configured
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Alert>
        <AlertDescription>
          If an account exists for that email, we sent a reset link. Check your
          inbox.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
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
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
        >
          Send reset link
        </Button>
      </FieldGroup>
    </form>
  )
}
