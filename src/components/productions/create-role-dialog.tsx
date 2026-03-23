"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useAction } from "next-safe-action/hooks"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod/v4"
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

const schema = z.object({
  name: z.string().trim().min(1, "Role name is required.").max(100),
  description: z.string().trim().optional(),
})

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

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  })

  const { execute, isPending } = useAction(createRole, {
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
        message: error.serverError ?? "We couldn't create the role. Try again.",
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((v) => execute({ ...v, productionId }))}
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
            <Button type="submit" loading={isPending}>
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
