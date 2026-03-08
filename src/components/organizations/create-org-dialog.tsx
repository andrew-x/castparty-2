"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { Controller } from "react-hook-form"
import { z } from "zod/v4"
import { createOrganization } from "@/actions/organizations/create-organization"
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
import { formResolver } from "@/lib/schemas/resolve"

const schema = z.object({
  name: z.string().trim().min(1, "Organization name is required."),
})

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrgDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const { form, action } = useHookFormAction(
    createOrganization,
    formResolver(schema),
    {
      formProps: { defaultValues: { name: "" } },
      actionProps: {
        onSuccess() {
          form.reset()
          onOpenChange(false)
          router.refresh()
        },
        onError({ error }) {
          form.setError("root", {
            message:
              error.serverError ??
              "We couldn't create the organization. Try again.",
          })
        },
      },
    },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => action.execute(v))}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="e.g. Riverside Community Theatre"
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
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
