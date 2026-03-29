"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { createRole } from "@/actions/productions/create-role"
import { Alert, AlertDescription } from "@/components/common/alert"
import { Button } from "@/components/common/button"
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/common/textarea"
import { formResolver } from "@/lib/schemas/resolve"
import { createRoleFormSchema } from "@/lib/schemas/role"

interface Props {
  productionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (roleSlug: string) => void
}

export function CreateRoleDialog({
  productionId,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const router = useRouter()

  const { form, action } = useHookFormAction(
    createRole,
    formResolver(createRoleFormSchema),
    {
      formProps: {
        defaultValues: { name: "", description: "" },
      },
      actionProps: {
        onSuccess({ data }) {
          form.reset()
          onOpenChange(false)
          router.refresh()
          if (data?.slug) {
            onCreated?.(data.slug)
          }
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ?? "We couldn't create the role. Try again.",
          })
        },
      },
    },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) =>
            action.execute({ ...v, productionId }),
          )}
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Role name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="e.g. Stage Manager"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>
                    Description (optional)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Brief description of this role"
                    rows={2}
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
            <Button type="submit" loading={action.isPending}>
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
