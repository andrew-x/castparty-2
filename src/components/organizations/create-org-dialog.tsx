"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"
import { Controller } from "react-hook-form"
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
import { createOrgFormSchema } from "@/lib/schemas/organization"
import { formResolver } from "@/lib/schemas/resolve"
import { slugify } from "@/lib/slugify"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateOrgDialog({ open, onOpenChange }: Props) {
  const router = useRouter()
  const slugTouchedRef = useRef(false)

  const { form, action } = useHookFormAction(
    createOrganization,
    formResolver(createOrgFormSchema),
    {
      formProps: { defaultValues: { name: "", slug: "" } },
      actionProps: {
        onSuccess() {
          form.reset()
          slugTouchedRef.current = false
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

  const nameValue = form.watch("name")
  useEffect(() => {
    if (!slugTouchedRef.current) {
      form.setValue("slug", slugify(nameValue))
    }
  }, [nameValue, form])

  function handleSlugChange(value: string) {
    if (value === "") {
      slugTouchedRef.current = false
      form.setValue("slug", slugify(nameValue))
    } else {
      slugTouchedRef.current = true
      form.setValue("slug", value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => action.execute(v))}>
          <FieldGroup className="gap-block">
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
            <Controller
              name="slug"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={field.name}>URL ID</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="text"
                    placeholder="e.g. riverside-community-theatre"
                    aria-invalid={fieldState.invalid}
                    onChange={(e) => handleSlugChange(e.target.value)}
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
