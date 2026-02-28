"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useAction } from "next-safe-action/hooks"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
import { changePasswordAction } from "@/actions/admin/change-password"
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

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
})

interface Props {
  user: { id: string; name: string } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ChangePasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "" },
  })

  useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  const { execute, isPending } = useAction(changePasswordAction, {
    onSuccess() {
      onOpenChange(false)
      onSuccess()
    },
    onError({ error }) {
      form.setError("root", {
        message: error.serverError ?? "Something went wrong.",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          {user && (
            <DialogDescription>
              Set a new password for {user.name}.
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => {
            if (!user) return
            execute({ userId: user.id, password: v.password })
          })}
        >
          <FieldGroup>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    autoComplete="new-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="submit" loading={isPending}>
              Change password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
