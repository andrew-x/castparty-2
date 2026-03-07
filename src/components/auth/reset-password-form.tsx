"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import type { z } from "zod"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/common/field"
import { Input } from "@/components/common/input"
import { authClient } from "@/lib/auth/auth-client"
import { resetPasswordSchema } from "@/lib/schemas/auth"

export function ResetPasswordForm({ token }: { token: string }) {
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  })

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    const { error: authError } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    })

    if (authError) {
      form.setError("root", {
        message: authError.message ?? "Something went wrong. Try again.",
      })
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div className="flex flex-col gap-group">
        <p className="text-body text-muted-foreground">
          Your password has been reset. You can now sign in with your new
          password.
        </p>
        <Button asChild className="w-full">
          <Link href="/auth">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor={field.name}>New password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  tooltip={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-0 right-0 h-9 w-9 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" />
                  ) : (
                    <EyeIcon className="size-4" />
                  )}
                </Button>
              </div>
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
        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          className="w-full"
        >
          Reset password
        </Button>
      </FieldGroup>
    </form>
  )
}
